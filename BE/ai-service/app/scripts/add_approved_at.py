import pymysql

conn = pymysql.connect(host='localhost', user='root', password='', database='medcare_user_db', charset='utf8mb4')
cursor = conn.cursor()

cursor.execute("SHOW COLUMNS FROM prescriptions LIKE 'approved_at'")
result = cursor.fetchone()

if result:
    print("Column 'approved_at' already EXISTS.")
else:
    print("Column 'approved_at' is MISSING. Adding now...")
    cursor.execute("ALTER TABLE prescriptions ADD COLUMN approved_at TIMESTAMP NULL COMMENT 'Thoi diem duoc duyet - dung de kiem tra hieu luc 90 ngay' AFTER is_used")
    conn.commit()
    print("Column 'approved_at' added successfully.")

cursor.execute("DESCRIBE prescriptions")
for row in cursor.fetchall():
    print(row)

conn.close()
