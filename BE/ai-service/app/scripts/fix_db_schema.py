import pymysql
from app.config.settings import settings

def run_migration():
    # Parse connection string
    # mysql+pymysql://root:@localhost:3306/medcare_chatbot_db?charset=utf8mb4
    # We'll just hardcode based on the settings for simplicity
    
    try:
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            database='medcare_chatbot_db',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            print("Checking for missing columns in chatbot_logs...")
            cursor.execute("SHOW COLUMNS FROM chatbot_logs LIKE 'rating'")
            if not cursor.fetchone():
                print("Adding column 'rating'...")
                cursor.execute("ALTER TABLE chatbot_logs ADD COLUMN rating BOOLEAN DEFAULT NULL AFTER suggested_medicines")
            else:
                print("Column 'rating' already exists.")
                
            cursor.execute("SHOW COLUMNS FROM chatbot_logs LIKE 'feedback_reason'")
            if not cursor.fetchone():
                print("Adding column 'feedback_reason'...")
                cursor.execute("ALTER TABLE chatbot_logs ADD COLUMN feedback_reason VARCHAR(255) DEFAULT NULL AFTER rating")
            else:
                print("Column 'feedback_reason' already exists.")
                
            connection.commit()
            print("Migration completed successfully.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    run_migration()
