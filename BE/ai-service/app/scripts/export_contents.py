from sqlalchemy import create_engine, text
from app.config.settings import settings

def export_content():
    engine = create_engine(settings.DATABASE_URL)
    result = engine.connect().execute(text("SELECT content FROM product_symptoms WHERE name LIKE '%khẩu trang%' LIMIT 3"))
    contents = [r[0] for r in result]
    with open('app/scripts/contents.txt', 'w', encoding='utf-8') as f:
        f.write('\n---\n'.join(contents))
    print(f"Exported {len(contents)} contents.")

if __name__ == "__main__":
    export_content()
