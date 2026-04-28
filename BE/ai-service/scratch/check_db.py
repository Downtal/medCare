import sqlalchemy
from sqlalchemy import create_engine, text
from app.config.settings import settings

def check_db():
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SHOW TABLES LIKE 'product_symptoms'"))
            table_exists = result.fetchone() is not None
            print(f"Table 'product_symptoms' exists: {table_exists}")
            
            if table_exists:
                count_result = connection.execute(text("SELECT COUNT(*) FROM product_symptoms"))
                count = count_result.fetchone()[0]
                print(f"Row count: {count}")
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    check_db()
