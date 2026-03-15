from fastapi.testclient import TestClient

from main import app


def run() -> None:
    client = TestClient(app)

    checks = [
        ("GET", "/health", 200),
        ("GET", "/api/repositories/", 200),
        ("GET", "/api/analysis/nikhilkumarpanigrahi/codeax/summary", 200),
        ("GET", "/api/analysis/nikhilkumarpanigrahi/codeax/security", 200),
        ("GET", "/api/analysis/nikhilkumarpanigrahi/codeax/tests", 200),
    ]

    for method, url, expected in checks:
        response = client.request(method, url)
        if response.status_code != expected:
            raise SystemExit(f"Smoke test failed for {method} {url}: {response.status_code} != {expected}")

    print("Backend smoke tests passed")


if __name__ == "__main__":
    run()
