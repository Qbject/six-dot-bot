from util import DatabaseConnection, get_random_str

def create(ownerId, schema, title):
	with DatabaseConnection() as cursor:
		page_id = generate_id()

		cursor.execute('''
			INSERT INTO pages (id, title, ownerId, schema)
			VALUES (?, ?, ?, ?)
		''', (page_id, title, ownerId, schema))
	
		return page_id

def get_by_id(id):
	with DatabaseConnection() as cursor:
		cursor.execute('''
			SELECT * FROM pages
			WHERE id = ?
		''', (id,))

		page = cursor.fetchone()
		return dict(page) if page else None

def get_by_owner(ownerId):
	# The list doesn't include all the fields for optimization purposes
	with DatabaseConnection() as cursor:
		cursor.execute('''
			SELECT id, title, modifiedAt FROM pages
			WHERE ownerId = ?
			ORDER BY modifiedAt DESC
		''', (ownerId,))

		pages = [dict(row) for row in cursor.fetchall()]

		return pages

def update(id, update_fields):
	with DatabaseConnection() as cursor:
		# Construct the SQL query to update the page
		set_fields = ', '.join([f"{field} = ?" for field in
			update_fields.keys()])
		set_fields += ", modifiedAt = CURRENT_TIMESTAMP"
		query = f"UPDATE pages SET {set_fields} WHERE id = ?"

		# Create a tuple of values to update, including the id
		values = tuple(update_fields.values()) + (id,)
		
		cursor.execute(query, values)

def delete(id):
	with DatabaseConnection() as cursor:
		cursor.execute("DELETE FROM pages WHERE id = ?", (id,))

def generate_id():
	new_id = get_random_str()
	duplicate_check = get_by_id(new_id)
	return generate_id() if duplicate_check else new_id