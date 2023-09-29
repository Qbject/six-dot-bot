from bottle import Bottle, static_file, response, request
from pathlib import Path
import os
import json
import dotenv
import database
import template_schemas
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

@app.route("/miniapp/js/config.js")
def public_config():
	config_data = {
		"bot_username": os.environ["BOT_USERNAME"],
		"bot_appname": os.environ["BOT_APPNAME"],
	}
	
	response.content_type = "application/javascript"
	return f"const config = {json.dumps(config_data)};\nexport default config"

@app.route("/api/handle_tg_update/<secret>")
def handle_update(secret):
	if secret != os.environ["WEB_SECRET"]:
		response.status = 403
		return "Not allowed"

# Create a new page
@app.post('/api/pages')
def create_page():
	web_app_data = get_web_app_data()
	if not web_app_data:
		response.status = 403
		return None
	
	is_onboarding = request.json and request.json.get("onboarding")
	if is_onboarding:
		title = template_schemas.onboarding["children"][0]["props"]["text"]
		schema = json.dumps(template_schemas.onboarding)
	else:
		title = template_schemas.default["children"][0]["props"]["text"]
		schema = json.dumps(template_schemas.default)
	
	user_data = json.loads(web_app_data["user"])
	page = database.create_new_page(user_data["id"], schema, title)
	
	return {
		"ok": True,
		"page": page
	}

# Update an existing page
@app.post('/api/pages/<pageId>')
def update_page(pageId):
	web_app_data = get_web_app_data()
	if not web_app_data:
		response.status = 403
		return None
	user_data = json.loads(web_app_data["user"])
	is_owner = database.user_owns(pageId, user_data["id"])
	if not is_owner:
		response.status = 403
		return None
	
	page_data = {
		"schema": request.json["schema"],
		"title": request.json["title"],
	}
	database.update_page(pageId, page_data)

# Retrieve a page by id
@app.get('/api/pages/<pageId>')
def get_page(pageId):
	page = database.get_page(pageId)
	if page:
		return {
			"ok": True,
			"page": page
		}
	
	response.status = 404
	return None

# Delete a page by id
@app.delete('/api/pages/<pageId>')
def delete_page(pageId):
	web_app_data = get_web_app_data()
	if not web_app_data:
		response.status = 403
		return None
	user_data = json.loads(web_app_data["user"])
	is_owner = database.user_owns(pageId, user_data["id"])
	if not is_owner:
		response.status = 403
		return None
	
	database.delete_page(pageId)

# get user pages overview
@app.get('/api/pages/my')
def list_pages():
	web_app_data = get_web_app_data()
	if not web_app_data:
		response.status = 403
		return None
	
	user_data = json.loads(web_app_data["user"])
	pages = database.get_user_pages(user_data["id"])
	return {
		"ok": True,
		"pages": pages
	}

def get_web_app_data():
	web_app_data = request.headers.get("X-Tg-Init-Data")
	if validate_init_data(web_app_data):
		return parse_init_data(web_app_data)


if __name__ == "__main__":
	app.run(host=os.environ["SERVER_HOST"], port=os.environ["SERVER_PORT"])
