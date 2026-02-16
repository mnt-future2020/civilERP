"""
Seed script for Civil ERP - Creates demo admin user and sample data
Run: python seed.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def seed():
    print("Starting seed...")

    # ==================== ADMIN USER ====================
    existing = await db.users.find_one({"email": "admin@civilcorp.com"})
    if existing:
        print("Admin user already exists, skipping...")
    else:
        admin_id = str(uuid.uuid4())
        admin_user = {
            "id": admin_id,
            "email": "admin@civilcorp.com",
            "name": "Admin",
            "role": "admin",
            "phone": "9876543210",
            "department": "Management",
            "password": pwd_context.hash("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.users.insert_one(admin_user)
        print(f"Admin user created: admin@civilcorp.com / admin123")

    # ==================== SITE ENGINEER ====================
    existing = await db.users.find_one({"email": "engineer@civilcorp.com"})
    if existing:
        print("Site engineer already exists, skipping...")
    else:
        engineer_id = str(uuid.uuid4())
        engineer_user = {
            "id": engineer_id,
            "email": "engineer@civilcorp.com",
            "name": "Rajesh Kumar",
            "role": "site_engineer",
            "phone": "9876543211",
            "department": "Engineering",
            "password": pwd_context.hash("engineer123"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.users.insert_one(engineer_user)
        print(f"Site engineer created: engineer@civilcorp.com / engineer123")

    # ==================== FINANCE USER ====================
    existing = await db.users.find_one({"email": "finance@civilcorp.com"})
    if existing:
        print("Finance user already exists, skipping...")
    else:
        finance_user = {
            "id": str(uuid.uuid4()),
            "email": "finance@civilcorp.com",
            "name": "Priya Sharma",
            "role": "finance",
            "phone": "9876543212",
            "department": "Finance",
            "password": pwd_context.hash("finance123"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.users.insert_one(finance_user)
        print(f"Finance user created: finance@civilcorp.com / finance123")

    # ==================== DEMO PROJECT ====================
    existing_project = await db.projects.find_one({"code": "PROJ-001"})
    if existing_project:
        print("Demo project already exists, skipping...")
    else:
        admin_doc = await db.users.find_one({"email": "admin@civilcorp.com"})
        project = {
            "id": str(uuid.uuid4()),
            "name": "Chennai Metro Phase 3",
            "code": "PROJ-001",
            "description": "Metro rail construction project covering 45km stretch in Chennai",
            "client_name": "CMRL",
            "location": "Chennai, Tamil Nadu",
            "start_date": "2026-01-15",
            "expected_end_date": "2028-06-30",
            "budget": 25000000.00,
            "status": "in_progress",
            "site_engineer_id": None,
            "created_by": admin_doc["id"] if admin_doc else "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.projects.insert_one(project)
        print(f"Demo project created: {project['name']}")

    # ==================== DEMO VENDOR ====================
    existing_vendor = await db.vendors.find_one({"code": "VND-001"})
    if existing_vendor:
        print("Demo vendor already exists, skipping...")
    else:
        vendor = {
            "id": str(uuid.uuid4()),
            "name": "Tamil Nadu Steel Suppliers",
            "code": "VND-001",
            "contact_person": "Murugan S",
            "email": "murugan@tnsteel.com",
            "phone": "9876500001",
            "address": "Industrial Estate, Ambattur, Chennai",
            "gst_number": "33AABCT1234F1ZP",
            "pan_number": "AABCT1234F",
            "category": "Steel & Iron",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.vendors.insert_one(vendor)
        print(f"Demo vendor created: {vendor['name']}")

    print("\n--- Seed complete! ---")
    print("Login credentials:")
    print("  Admin:    admin@civilcorp.com / admin123")
    print("  Engineer: engineer@civilcorp.com / engineer123")
    print("  Finance:  finance@civilcorp.com / finance123")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
