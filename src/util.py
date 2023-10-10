import os, sqlite3, string, random
from pathlib import Path

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
	tpl_dir = Path(os.environ["BASE_PATH"]) / "src" / "schema_templates"
	
	if is_onboarding:
		bot_name = os.environ["BOT_DISPLAY_NAME"]
		schema_path = tpl_dir / "onboarding.json"
		schema = schema_path.read_text(encoding="utf-8")
		schema = schema.replace("%BOT_NAME%", bot_name)
		title = f"Welcome to the {bot_name}!"
	
	else:
		schema_path = tpl_dir / "default.json"
		schema = schema_path.read_text(encoding="utf-8")
		title = "New page"
	
	return (schema, title)

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
		cursor.execute("""
		CREATE TABLE IF NOT EXISTS pages (
			id TEXT PRIMARY KEY,
			title TEXT,
			ownerId INTEGER,
			schema TEXT,
			createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			modifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	""")

def get_random_str(length=16):
	characters = string.ascii_letters + string.digits
	return "".join(random.choice(characters) for _ in range(length))

def ucfirst(input_str):
	if input_str:
		return input_str[0].upper() + input_str[1:]
	return input_str