import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data.db")


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    db = await aiosqlite.connect(DB_PATH)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            google_id TEXT UNIQUE,
            password_hash TEXT,
            name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.commit()

    # Insert test account (INSERT OR IGNORE to skip if already exists)
    import bcrypt
    test_password_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    await db.execute(
        "INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (?, ?, ?)",
        ("test-user-001", "admin@finsight.com", test_password_hash),
    )
    await db.commit()
    await db.close()
