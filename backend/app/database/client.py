from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global client
    if client is None:
        try:
            client = AsyncIOMotorClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000,
            )
            await client.admin.command("ping")
            db = client.get_default_database()
            await db["analysis_reports"].create_index([("repository", 1), ("pr_number", 1)], unique=True)
            await db["pull_request_snapshots"].create_index([("repository", 1), ("pr_number", 1)], unique=True)
            await db["health_history"].create_index([("repository", 1), ("timestamp", 1)])
            await db["webhook_deliveries"].create_index([("delivery_id", 1)], unique=True)
        except Exception:
            # Keep the API available even when Mongo is unavailable.
            client = None


async def close_mongo_connection() -> None:
    global client
    if client is not None:
        client.close()
        client = None
