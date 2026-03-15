from __future__ import annotations

from datetime import datetime
from typing import Any

from app.database import client

_MEMORY_ANALYSIS_REPORTS: dict[tuple[str, int], dict[str, Any]] = {}
_MEMORY_PULL_REQUEST_SNAPSHOTS: dict[tuple[str, int], dict[str, Any]] = {}
_MEMORY_HEALTH_HISTORY: dict[str, list[dict[str, Any]]] = {}
_MEMORY_WEBHOOK_DELIVERIES: dict[str, dict[str, Any]] = {}

def _get_db():
    if client.client is None:
        return None
    return client.client.get_default_database()

async def save_analysis_report(repository: str, pr_number: int, report: dict[str, Any]) -> None:
    db = _get_db()
    query = {"repository": repository, "pr_number": pr_number}
    report["repository"] = repository
    report["pr_number"] = pr_number
    report["persisted_at"] = datetime.utcnow().isoformat()
    if db is None:
        _MEMORY_ANALYSIS_REPORTS[(repository, pr_number)] = dict(report)
        return
    await db["analysis_reports"].replace_one(query, report, upsert=True)

async def get_analysis_report(repository: str, pr_number: int) -> dict[str, Any] | None:
    db = _get_db()
    if db is None:
        payload = _MEMORY_ANALYSIS_REPORTS.get((repository, pr_number))
        return dict(payload) if payload else None
    report = await db["analysis_reports"].find_one({"repository": repository, "pr_number": pr_number})
    if report:
        report.pop("_id", None)
    return report

async def list_repository_reports(repository: str) -> list[dict[str, Any]]:
    db = _get_db()
    if db is None:
        items = [
            dict(item)
            for (repo_key, _), item in _MEMORY_ANALYSIS_REPORTS.items()
            if repo_key == repository
        ]
        items.sort(key=lambda x: x.get("generated_at", ""), reverse=True)
        return items[:100]
    cursor = db["analysis_reports"].find({"repository": repository}).sort("generated_at", -1)
    results = await cursor.to_list(length=100)
    for r in results:
        r.pop("_id", None)
    return results

async def save_pull_request_snapshot(repository: str, pr_number: int, snapshot: dict[str, Any]) -> None:
    db = _get_db()
    query = {"repository": repository, "pr_number": pr_number}
    snapshot["repository"] = repository
    snapshot["pr_number"] = pr_number
    if "updated_at" not in snapshot:
         snapshot["updated_at"] = datetime.utcnow().isoformat()
    if db is None:
        _MEMORY_PULL_REQUEST_SNAPSHOTS[(repository, pr_number)] = dict(snapshot)
        return
    await db["pull_request_snapshots"].replace_one(query, snapshot, upsert=True)

async def list_pull_request_snapshots(repository: str) -> list[dict[str, Any]]:
    db = _get_db()
    if db is None:
        items = [
            dict(item)
            for (repo_key, _), item in _MEMORY_PULL_REQUEST_SNAPSHOTS.items()
            if repo_key == repository
        ]
        items.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return items[:100]
    cursor = db["pull_request_snapshots"].find({"repository": repository}).sort("updated_at", -1)
    results = await cursor.to_list(length=100)
    for r in results:
        r.pop("_id", None)
    return results

async def append_health_history(repository: str, health_snapshot: dict[str, Any]) -> None:
    db = _get_db()
    health_snapshot["repository"] = repository
    if "timestamp" not in health_snapshot:
        health_snapshot["timestamp"] = datetime.utcnow().isoformat()
    if db is None:
        _MEMORY_HEALTH_HISTORY.setdefault(repository, []).append(dict(health_snapshot))
        return
    await db["health_history"].insert_one(health_snapshot)

async def get_health_history(repository: str) -> list[dict[str, Any]]:
    db = _get_db()
    if db is None:
        items = [dict(item) for item in _MEMORY_HEALTH_HISTORY.get(repository, [])]
        items.sort(key=lambda x: x.get("timestamp", ""))
        return items[:1000]
    cursor = db["health_history"].find({"repository": repository}).sort("timestamp", 1)
    results = await cursor.to_list(length=1000)
    for r in results:
        r.pop("_id", None)
    return results


async def register_webhook_delivery(delivery_id: str, event_type: str, repository: str) -> bool:
    """Returns True when a delivery ID is first seen, False when duplicate."""
    if not delivery_id:
        return True

    db = _get_db()
    payload = {
        "delivery_id": delivery_id,
        "event_type": event_type,
        "repository": repository,
        "received_at": datetime.utcnow().isoformat(),
    }

    if db is None:
        if delivery_id in _MEMORY_WEBHOOK_DELIVERIES:
            return False
        _MEMORY_WEBHOOK_DELIVERIES[delivery_id] = payload
        return True

    existing = await db["webhook_deliveries"].find_one({"delivery_id": delivery_id})
    if existing:
        return False
    await db["webhook_deliveries"].insert_one(payload)
    return True
