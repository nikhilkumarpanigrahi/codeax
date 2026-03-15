import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_inst = Database()

async def connect_to_mongo():
    db_inst.client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db_inst.db = db_inst.client[os.getenv("MONGODB_DB_NAME", "codeax")]
    print("Connected to MongoDB!")

async def close_mongo_connection():
    if db_inst.client:
        db_inst.client.close()
        print("Closed MongoDB connection.")

def get_database():
    return db_inst.db