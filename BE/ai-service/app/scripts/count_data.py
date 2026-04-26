from sqlalchemy import create_engine, func
from app.config.settings import settings
from app.models.product_symptom import ProductSymptom
from sqlalchemy.orm import sessionmaker

def count_data():
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    count = session.query(func.count(ProductSymptom.id)).scalar()
    print(f"Total products in product_symptoms: {count}")
    session.close()

if __name__ == "__main__":
    count_data()
