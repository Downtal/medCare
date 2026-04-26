from sqlalchemy import create_engine, text
from app.config.settings import settings

def export_names():
    engine = create_engine(settings.DATABASE_URL)
    result = engine.connect().execute(text('SELECT name FROM product_symptoms'))
    names = [r[0] for r in result]
    with open('app/scripts/names.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(names))
    print(f"Exported {len(names)} names.")

if __name__ == "__main__":
    export_names()
