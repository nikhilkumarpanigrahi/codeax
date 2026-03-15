import hashlib
import hmac
import time
import jwt
from datetime import datetime
from typing import Any

import httpx

from app.config import settings
from app.database.state import save_pull_request_snapshot
from app.services.agent_engine import PullRequestContext

from app.models import PullRequestModel, RepositoryHealth, RepositoryModel


_INSTALLATION_ID_CACHE: dict[str, int] = {}
_INSTALLATION_TOKEN_CACHE: dict[int, tuple[str, int]] = {}


class GitHubService:
    """GitHub integration service for live data."""
    """GitHub API service with token or GitHub App authentication."""

    def _get_static_token(self) -> str:
        token = (settings.github_token or "").strip()
        if not token:
            return ""
        placeholder_prefixes = ("replace_with_", "your_", "example")
        if token.lower().startswith(placeholder_prefixes):
            return ""
        return token

    def _build_headers(self, token: str = "") -> dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def _request_json(self, method: str, url: str, headers: dict[str, str], payload: dict[str, Any] | None = None) -> Any:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.request(method, url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def _get_repository_token(self, owner: str, repo: str) -> str:
        return await self._get_installation_token(owner, repo)

    def _load_private_key(self) -> str:
        inline_key = (settings.github_private_key or "").strip()
        if inline_key:
            return inline_key.replace("\\n", "\n")

        if settings.github_private_key_path:
            try:
                with open(settings.github_private_key_path, "r", encoding="utf-8") as key_file:
                    return key_file.read()
            except Exception:
                return ""
        return ""

    async def _get_app_jwt(self) -> str:
        private_key = self._load_private_key()
        if not private_key or not settings.github_app_id:
            return ""
        payload = {
            "iat": int(time.time()),
            "exp": int(time.time()) + (10 * 60),
            "iss": settings.github_app_id,
        }
        return jwt.encode(payload, private_key, algorithm="RS256")

    async def _resolve_installation_id(self, owner: str, repo: str, headers: dict[str, str]) -> int | None:
        cache_key = f"{owner}/{repo}".lower()
        if cache_key in _INSTALLATION_ID_CACHE:
            return _INSTALLATION_ID_CACHE[cache_key]

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{settings.github_api_base_url}/repos/{owner}/{repo}/installation",
                headers=headers,
            )
            if resp.status_code != 200:
                return None
            installation_id = int(resp.json().get("id") or 0)
            if installation_id > 0:
                _INSTALLATION_ID_CACHE[cache_key] = installation_id
                return installation_id
        return None

    def _get_cached_installation_token(self, installation_id: int) -> str:
        token_payload = _INSTALLATION_TOKEN_CACHE.get(installation_id)
        if not token_payload:
            return ""
        token, expires_at_epoch = token_payload
        # Refresh token before expiry to avoid race under concurrent requests.
        if time.time() >= expires_at_epoch - max(1, settings.github_installation_token_ttl_buffer_seconds):
            return ""
        return token

    async def _get_installation_token(self, owner: str, repo: str) -> str:
        static_token = self._get_static_token()
        if static_token:  # Fallback to static token if provided
            return static_token
            
        app_jwt = await self._get_app_jwt()
        if not app_jwt:
            return ""
            
        headers = {
            "Authorization": f"Bearer {app_jwt}",
            "Accept": "application/vnd.github.v3+json"
        }

        installation_id = await self._resolve_installation_id(owner, repo, headers)
        if not installation_id:
            return ""

        cached_token = self._get_cached_installation_token(installation_id)
        if cached_token:
            return cached_token

        async with httpx.AsyncClient(timeout=15) as client:
            token_resp = await client.post(
                f"{settings.github_api_base_url}/app/installations/{installation_id}/access_tokens",
                headers=headers
            )
            token_resp.raise_for_status()
            payload = token_resp.json()
            token = payload.get("token", "")
            expires_at = payload.get("expires_at", "")
            expires_at_epoch = int(time.time()) + 300
            if expires_at:
                try:
                    expires_at_epoch = int(datetime.fromisoformat(expires_at.replace("Z", "+00:00")).timestamp())
                except Exception:
                    expires_at_epoch = int(time.time()) + 300
            if token:
                _INSTALLATION_TOKEN_CACHE[installation_id] = (token, expires_at_epoch)
            return token

    async def _get_pull_request_files(self, owner: str, repo: str, pr_number: int, token: str = "") -> list[dict[str, str]]:
        headers = self._build_headers(token)
        page = 1
        files: list[dict[str, str]] = []

        while True:
            url = f"{settings.github_api_base_url}/repos/{owner}/{repo}/pulls/{pr_number}/files?per_page=100&page={page}"
            payload = await self._request_json("GET", url, headers)
            if not isinstance(payload, list) or not payload:
                break

            for item in payload:
                files.append(
                    {
                        "filename": item.get("filename", ""),
                        "patch": item.get("patch", ""),
                    }
                )

            if len(payload) < 100:
                break
            page += 1

        return files

    def is_valid_webhook_signature(self, payload_body: bytes, signature_header: str | None) -> bool:
        if not settings.github_webhook_secret:
            return True
        if not signature_header:
            return False
        digest = hmac.new(settings.github_webhook_secret.encode("utf-8"), payload_body, hashlib.sha256).hexdigest()
        expected = f"sha256={digest}"
        return hmac.compare_digest(expected, signature_header)

    async def build_context_from_webhook_payload(self, payload: dict[str, Any]) -> PullRequestContext | None:
        pr = payload.get("pull_request")
        repo = payload.get("repository")
        if not pr or not repo:
            return None

        owner = repo.get("owner", {}).get("login", "")
        repo_name = repo.get("name", "")
        pr_number = pr.get("number", 0)
        token = ""
        if owner and repo_name and pr_number:
            try:
                token = await self._get_repository_token(owner, repo_name)
            except Exception:
                token = ""

        changed_files: list[dict[str, str]] = []
        if owner and repo_name and pr_number:
            try:
                changed_files = await self._get_pull_request_files(owner, repo_name, pr_number, token)
            except Exception:
                changed_files = []

        repository_name = repo.get("full_name", f"{repo.get('owner', {}).get('login', 'unknown')}/{repo.get('name', 'repo')}")
        snapshot = {
            "number": pr.get("number", 0),
            "repository": repository_name,
            "title": pr.get("title", ""),
            "author": pr.get("user", {}).get("login", "unknown"),
            "status": "open" if pr.get("state") == "open" else "closed",
            "additions": pr.get("additions", 0),
            "deletions": pr.get("deletions", 0),
            "files_changed": pr.get("changed_files", len(changed_files)),
            "updated_at": datetime.utcnow().isoformat(),
        }
        await save_pull_request_snapshot(repository_name, snapshot["number"], snapshot)

        return PullRequestContext(
            repository=repository_name,
            number=pr_number,
            title=pr.get("title", ""),
            body=pr.get("body", ""),
            author=pr.get("user", {}).get("login", "unknown"),
            changed_files=changed_files,
            additions=pr.get("additions", 0),
            deletions=pr.get("deletions", 0),
        )

    async def build_context_from_pull_request(self, owner: str, repo: str, pr_number: int) -> PullRequestContext:
        token = await self._get_repository_token(owner, repo)
        headers = self._build_headers(token)
        pr_url = f"{settings.github_api_base_url}/repos/{owner}/{repo}/pulls/{pr_number}"

        payload = await self._request_json("GET", pr_url, headers)
        changed_files = await self._get_pull_request_files(owner, repo, pr_number, token)
        repository_name = f"{owner}/{repo}"

        snapshot = {
            "number": pr_number,
            "repository": repository_name,
            "title": payload.get("title", ""),
            "author": payload.get("user", {}).get("login", "unknown"),
            "status": "merged" if payload.get("merged_at") else payload.get("state", "open"),
            "additions": payload.get("additions", 0),
            "deletions": payload.get("deletions", 0),
            "files_changed": payload.get("changed_files", len(changed_files)),
            "updated_at": datetime.utcnow().isoformat(),
        }
        await save_pull_request_snapshot(repository_name, pr_number, snapshot)

        return PullRequestContext(
            repository=repository_name,
            number=pr_number,
            title=payload.get("title", ""),
            body=payload.get("body", ""),
            author=payload.get("user", {}).get("login", "unknown"),
            changed_files=changed_files,
            additions=payload.get("additions", 0),
            deletions=payload.get("deletions", 0),
        )

    async def post_pull_request_comment(self, repository: str, pr_number: int, comment_body: str) -> bool:
        if not repository or "/" not in repository:
            return False

        owner, repo = repository.split("/", 1)
        token = await self._get_installation_token(owner, repo)
        
        if not token:
            print("No GitHub token available. Skipping comment.")
            return False

        url = f"{settings.github_api_base_url}/repos/{owner}/{repo}/issues/{pr_number}/comments"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        payload = {"body": comment_body}
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, json=payload, headers=headers)
            return response.status_code in [200, 201]

    async def _get_auth_headers(self, owner: str | None = None, repo: str | None = None) -> dict[str, str]:
        """
        Prefer a static GitHub token when provided; otherwise fall back to GitHub App installation tokens.
        """
        token = settings.github_token
        if not token and owner and repo:
            token = await self._get_installation_token(owner, repo)

        headers: dict[str, str] = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def list_repositories(self) -> list[RepositoryModel]:
        """
        Return live repositories for the authenticated user/org when possible.
        Falls back gracefully to an empty list if GitHub is unreachable.
        """
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                # Use the "current user repos" endpoint; respects the provided token scopes.
                resp = await client.get(
                    f"{settings.github_api_base_url}/user/repos",
                    headers=await self._get_auth_headers(),
                    params={"per_page": 50, "sort": "pushed"},
                )
                if resp.status_code != 200:
                    print(f"GitHub list_repositories error: {resp.status_code} {resp.text}")
                    return []

                repos: list[RepositoryModel] = []
                for item in resp.json():
                    owner_login = item.get("owner", {}).get("login", "")
                    name = item.get("name", "")
                    full_name = item.get("full_name", f"{owner_login}/{name}")
                    description = item.get("description")
                    stars = item.get("stargazers_count", 0)
                    language = item.get("language")
                    # Health is derived from analysis history; start neutral for new repos.
                    health = RepositoryHealth(code_quality=80, security=80, tests=70, overall=78)
                    repos.append(
                        RepositoryModel(
                            owner=owner_login,
                            name=name,
                            full_name=full_name,
                            description=description,
                            stars=stars,
                            language=language,
                            health=health,
                        )
                    )
                return repos
        except Exception as exc:  # pragma: no cover - best‑effort logging
            print(f"GitHub list_repositories exception: {exc}")
            return []

    async def list_pull_requests(self, owner: str, repo: str) -> list[PullRequestModel]:
        """
        Return live pull requests for the given repository from GitHub.
        """
        repository_name = f"{owner}/{repo}"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{settings.github_api_base_url}/repos/{owner}/{repo}/pulls",
                    headers=await self._get_auth_headers(owner, repo),
                    params={"state": "all", "per_page": 50},
                )
                if resp.status_code != 200:
                    print(f"GitHub list_pull_requests error: {resp.status_code} {resp.text}")
                    return []

                items = resp.json()
                pull_requests: list[PullRequestModel] = []
                for pr in items:
                    status = "open"
                    if pr.get("draft"):
                        status = "draft"
                    elif pr.get("merged_at"):
                        status = "merged"
                    elif pr.get("state") == "closed":
                        status = "closed"

                    # GitHub includes additions/deletions/changed_files on single-PR endpoint; guard with defaults here.
                    pull_requests.append(
                        PullRequestModel(
                            number=pr.get("number", 0),
                            repository=repository_name,
                            title=pr.get("title", ""),
                            author=pr.get("user", {}).get("login", "unknown"),
                            status=status,
                            additions=pr.get("additions", 0),
                            deletions=pr.get("deletions", 0),
                            files_changed=pr.get("changed_files", 0),
                            updated_at=pr.get("updated_at", datetime.utcnow()),
                        )
                    )
                return pull_requests
        except Exception as exc:  # pragma: no cover - best‑effort logging
            print(f"GitHub list_pull_requests exception: {exc}")
            return []
        token = self._get_static_token()
        if not token:
            return [
                RepositoryModel(
                    owner="octo-org",
                    name="codeax-ai",
                    full_name="octo-org/codeax-ai",
                    description="AI review and security assistant",
                    stars=314,
                    language="TypeScript",
                    health=RepositoryHealth(code_quality=84, security=88, tests=76, overall=83),
                ),
            ]

        headers = self._build_headers(token)
        repos: list[RepositoryModel] = []
        page = 1

        try:
            while True:
                url = f"{settings.github_api_base_url}/user/repos?per_page=100&page={page}&sort=updated"
                payload = await self._request_json("GET", url, headers)
                if not isinstance(payload, list) or not payload:
                    break

                for item in payload:
                    full_name = item.get("full_name", "")
                    owner = item.get("owner", {}).get("login", "")
                    name = item.get("name", "")
                    if not owner or not name:
                        continue

                    health = self._derive_repository_health(item)

                    repos.append(
                        RepositoryModel(
                            owner=owner,
                            name=name,
                            full_name=full_name or f"{owner}/{name}",
                            description=item.get("description"),
                            stars=int(item.get("stargazers_count") or 0),
                            language=item.get("language") or "Unknown",
                            health=health,
                        )
                    )

                if len(payload) < 100:
                    break
                page += 1
        except Exception:
            return [
                RepositoryModel(
                    owner="octo-org",
                    name="codeax-ai",
                    full_name="octo-org/codeax-ai",
                    description="AI review and security assistant",
                    stars=314,
                    language="TypeScript",
                    health=RepositoryHealth(code_quality=84, security=88, tests=76, overall=83),
                ),
            ]

        return repos

    def _derive_repository_health(self, item: dict[str, Any]) -> RepositoryHealth:
        # Heuristic scoring so repositories don't all collapse to the same value.
        stars = int(item.get("stargazers_count") or 0)
        open_issues = int(item.get("open_issues_count") or 0)
        language = (item.get("language") or "").strip()
        is_archived = bool(item.get("archived"))

        pushed_at_raw = item.get("pushed_at") or item.get("updated_at")
        days_since_push = 365
        if pushed_at_raw:
            try:
                pushed_at = datetime.fromisoformat(str(pushed_at_raw).replace("Z", "+00:00"))
                days_since_push = max(0, (datetime.now(pushed_at.tzinfo) - pushed_at).days)
            except Exception:
                days_since_push = 365

        overall = 82
        overall -= min(32, open_issues * 2)
        overall += min(8, stars // 40)

        if days_since_push <= 7:
            overall += 7
        elif days_since_push <= 30:
            overall += 4
        elif days_since_push <= 90:
            overall += 1
        elif days_since_push > 180:
            overall -= 4

        if language:
            overall += 2
        else:
            overall -= 2

        if is_archived:
            overall -= 18

        overall = max(45, min(96, overall))
        code_quality = max(40, min(98, overall - 2 + (1 if language else -1)))
        security = max(42, min(99, overall + 3 - min(6, open_issues // 4)))
        tests = max(35, min(95, overall - 4 + (4 if stars > 100 else 0)))

        return RepositoryHealth(
            code_quality=code_quality,
            security=security,
            tests=tests,
            overall=overall,
        )

    async def list_pull_requests(self, owner: str, repo: str) -> list[PullRequestModel]:
        token = await self._get_repository_token(owner, repo)
        headers = self._build_headers(token)
        repository_name = f"{owner}/{repo}"

        url = f"{settings.github_api_base_url}/repos/{owner}/{repo}/pulls?state=all&per_page=30&sort=updated&direction=desc"
        try:
            payload = await self._request_json("GET", url, headers)
        except Exception:
            return [
                PullRequestModel(
                    number=128,
                    repository=repository_name,
                    title="Harden webhook signature validation",
                    author="nikhilk",
                    status="open",
                    additions=210,
                    deletions=67,
                    files_changed=9,
                    updated_at=datetime.utcnow(),
                ),
            ]

        pull_requests: list[PullRequestModel] = []
        for item in payload:
            raw_state = item.get("state", "open")
            status = "merged" if item.get("merged_at") else raw_state
            if item.get("draft"):
                status = "draft"

            pull_requests.append(
                PullRequestModel(
                    number=int(item.get("number") or 0),
                    repository=repository_name,
                    title=item.get("title", "Untitled pull request"),
                    author=item.get("user", {}).get("login", "unknown"),
                    status=status,
                    additions=int(item.get("additions") or 0),
                    deletions=int(item.get("deletions") or 0),
                    files_changed=int(item.get("changed_files") or 0),
                    updated_at=datetime.fromisoformat(item.get("updated_at", datetime.utcnow().isoformat()).replace("Z", "+00:00")),
                )
            )

        return pull_requests
