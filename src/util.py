import os, json, sqlite3, string, random

def sanitize_html(text):
	text = text.replace("&", "&amp;")
	text = text.replace("<", "&lt;")
	text = text.replace(">", "&gt;")
	return text

def ucfirst(input_str):
	if input_str:
		return input_str[0].upper() + input_str[1:]
	return input_str

def get_schema_template(is_onboarding):
	if is_onboarding:
		schema = {
			"children": [
				{
					"typeName": "heading",
					"props": {
						"text": "This is onboarding page!"
					}
				},
				{
					"typeName": "paragraph",
					"props": {
						"text": "TODO: explain some basics here?"
					}
				}
			]
		}
		title = "This is onboarding page!"
	
	else:
		schema = {
			"children": [
				{
					"typeName": "heading",
					"props": {
						"text": "You just created a new page!"
					}
				},
				{
					"typeName": "paragraph",
					"props": {
						"text": "TODO: explain some basics here?"
					}
				}
			]
		}
		title = "You just created a new page!"
	
	return (json.dumps(schema), title)

class DatabaseConnection:
	def __enter__(self):
		self.conn = sqlite3.connect(os.environ["DB_PATH"])
		self.conn.row_factory = sqlite3.Row
		self.cursor = self.conn.cursor()
		return self.cursor

	def __exit__(self, exc_type, exc_value, traceback):
		self.conn.commit()
		self.conn.close()

def init_database():
	with DatabaseConnection() as cursor:
		cursor.execute('''
		CREATE TABLE IF NOT EXISTS pages (
			id TEXT PRIMARY KEY,
			title TEXT,
			ownerId INTEGER,
			schema TEXT,
			createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			modifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	''')

def get_random_str(length=16):
	characters = string.ascii_letters + string.digits
	return ''.join(random.choice(characters) for _ in range(length))

def ucfirst(input_str):
	if input_str:
		return input_str[0].upper() + input_str[1:]
	return input_str