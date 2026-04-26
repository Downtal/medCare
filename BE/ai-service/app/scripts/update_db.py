from sqlalchemy import create_engine, text
from app.config.settings import settings

def update_database():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as connection:
        print("Checking for missing columns in chatbot_logs...")
        
        # Add rating column
        try:
            connection.execute(text("ALTER TABLE chatbot_logs ADD COLUMN rating BOOLEAN NULL"))
            print("Added 'rating' column.")
        except Exception as e:
            print(f"'rating' column might already exist or error: {e}")

        # Add feedback_reason column
        try:
            connection.execute(text("ALTER TABLE chatbot_logs ADD COLUMN feedback_reason VARCHAR(255) NULL"))
            print("Added 'feedback_reason' column.")
        except Exception as e:
            print(f"'feedback_reason' column might already exist or error: {e}")
        
        connection.commit()
        print("Database update complete.")

if __name__ == "__main__":
    update_database()
