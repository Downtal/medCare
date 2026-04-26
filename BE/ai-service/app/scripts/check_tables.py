from sqlalchemy import create_engine, inspect
from app.config.settings import settings

def check_tables():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables:", tables)
    if "product_symptoms" in tables:
        print("product_symptoms table EXISTS.")
    else:
        print("product_symptoms table MISSING.")

if __name__ == "__main__":
    check_tables()
