from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

# Load environment variables from the .env file once at import time.
# This keeps configuration centralized in the environment and avoids
# hard‑coding connection details in the code.
load_dotenv()


class Database:
    """
    Simple holder for the MongoDB client and database instances.

    Using a separate class instead of module‑level globals makes it
    easier to type‑hint and to extend later (e.g. add multiple DBs).
    """

    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


db_inst = Database()

async def connect_to_mongo():
    db_inst.client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db_inst.db = db_inst.client[os.getenv("MONGODB_DB_NAME", "codeax")]
    print("Connected to MongoDB!")

async def connect_to_mongo() -> None:
    """
    Initialize the global MongoDB client and database.

    - Uses the async motor driver (AsyncIOMotorClient).
    - Reads the MongoDB URI from the MONGODB_URI variable in .env.
    - Ensures the database used is named 'repo_ai_manager'.
    """
    if db_inst.client is not None:
        # Connection is already initialized, nothing to do.
        return

    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI is not set in the environment")

    # Create a single, shared async client instance.
    db_inst.client = AsyncIOMotorClient(mongodb_uri)

    # Always use the required database name, regardless of what is
    # specified in the URI.
    db_inst.db = db_inst.client["repo_ai_manager"]

    # Accessing the collection ensures it is created lazily on first use.
    _ = db_inst.db["repositories"]


async def close_mongo_connection() -> None:
    """
    Cleanly close the MongoDB client when the application shuts down.
    """
    if db_inst.client is not None:
        db_inst.client.close()
        db_inst.client = None
        db_inst.db = None


def get_database() -> AsyncIOMotorDatabase:
    """
    Return the active MongoDB database instance.

    This function is safe to call from request handlers and services,
    assuming `connect_to_mongo` has successfully run during startup.
    """
    if db_inst.db is None:
        raise RuntimeError("Database not initialized; call connect_to_mongo() at startup.")
    return db_inst.db