from sqlalchemy import create_engine, text
from app.config.settings import settings

def check_db():
    engine = create_engine(settings.DATABASE_URL)
    query = "SELECT id, name FROM product_symptoms WHERE name LIKE '%KHẨU TRANG%'"
    result = engine.connect().execute(text(query)).fetchall()
    print(f"Found {len(result)} matches.")

if __name__ == "__main__":
    check_db()
