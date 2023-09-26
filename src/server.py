from bottle import Bottle, static_file, response, request
from pathlib import Path
import os
import json
import dotenv
import database
from util import validate_init_data, parse_init_data

base_dir = Path(__file__).parent
webroot = base_dir.parent / "public" / "miniapp"
dotenv.load_dotenv()

app = Bottle()

@app.route("/miniapp")
def index():
	return static_file("index.html", root=webroot)

@app.route("/miniapp/<filepath:path>")
def static(filepath):
	return static_file(filepath, root=webroot)

@app.route("/api/handle_tg_update/<secret>")
def handle_update(secret):
	if secret != os.environ["WEB_SECRET"]:
		response.status = 403
		return "Not allowed"

# Create a new page
@app.post('/api/pages')
def create_page():
	page = database.create_new_page(0) # TODO: owner!
	
	return {
		"ok": True,
		"page": page
	}

# Update an existing page
@app.post('/api/pages/<id>')
def update_page(id):
	schema = request.text
	database.update_page(id, schema)


# Retrieve a page by id
@app.get('/api/pages/<id>')
def get_page(id):
	page = database.get_page(id)
	if page: return page
	
	response.status = 404
	return None

# Delete a page by id
@app.delete('/api/pages/<id>')
def delete_page(id):
	database.delete_page(id)

# get user pages overview
@app.get('/api/pages/my')
def list_pages():
	web_app_data = get_web_app_data()
	if not web_app_data:
		response.status = 403
		return None
	
	user_data = json.loads(web_app_data["user"])
	return database.get_user_pages(user_data["id"])

def get_web_app_data():
	web_app_data = request.headers.get("X-Tg-Init-Data")
	if validate_init_data(web_app_data):
		return parse_init_data(web_app_data)

if __name__ == "__main__":
	app.run(host=os.environ["SERVER_HOST"], port=os.environ["SERVER_PORT"])
