import sqlite3, string, random, json

# Database file name
DB_FILE = "../bot.db"

default_page_schema = json.dumps({
    "blocks": [
        {
            "type": "title",
            "props": {
                "text": "You just created a new page!"
            }
        },
        {
            "type": "paragraph",
            "props": {
                "text": "TODO: explain some basics here?"
            }
        }
    ]
})

def create_database():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pages (
            id TEXT PRIMARY KEY,
            title TEXT,
            ownerId INTEGER,
            schema TEXT
        )
    ''')

    conn.commit()
    conn.close()

def create_new_page(ownerId):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    unique_id = generate_unique_page_id(cursor)
    title = ""
    schema = default_page_schema

    cursor.execute('''
        INSERT INTO pages (id, title, ownerId, schema)
        VALUES (?, ?, ?, ?)
    ''', (unique_id, title, ownerId, schema))

    conn.commit()
    conn.close()
    
    return {
        "id": unique_id,
        "title": title,
        "ownerId": ownerId,
        "schema": schema
    }

def update_page(id, update_fields):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Construct the SQL query to update the page
    set_fields = ', '.join([f"{field} = ?" for field in update_fields.keys()])
    query = f"UPDATE pages SET {set_fields} WHERE id = ?;"

    # Create a tuple of values to update, including the id
    values = tuple(update_fields.values()) + (id,)
    
    cursor.execute(query, values)
    
    conn.commit()
    conn.close()

def delete_page(id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM pages WHERE id = ?", (id,))
    
    conn.commit()
    conn.close()

def get_page(id):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM pages
        WHERE id = ?
    ''', (id,))

    page = cursor.fetchone()
    conn.close()

    return dict(page) if page else None

# gets basic info enough to list user pages
def get_user_pages(ownerId):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('''
        SELECT id, title FROM pages
        WHERE ownerId = ?
    ''', (ownerId,))

    pages = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return pages

def generate_page_id(length=16):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def is_page_id_unique(cursor, generated_id):
    cursor.execute("SELECT COUNT(*) FROM pages WHERE id = ?", (generated_id,))
    count = cursor.fetchone()[0]
    return count == 0

def generate_unique_page_id(cursor):
    while True:
        new_id = generate_page_id()
        if is_page_id_unique(cursor, new_id):
            return new_id


if __name__ == "__main__":
    create_database()