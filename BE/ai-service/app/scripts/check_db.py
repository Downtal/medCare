from sqlalchemy import create_engine, text
from app.config.settings import settings

def check_schema():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("DESCRIBE chatbot_logs"))
        for row in result:
            print(row)

if __name__ == "__main__":
    check_schema()
