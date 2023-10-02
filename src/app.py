from bottle import static_file, response, get, run
from pathlib import Path
import os
import json
import dotenv
from util import init_database
import tgapi
import rest_api

# Telegram updates
@get("/api/handle_tg_update/<secret>")
def handle_tg_update(secret):
	if secret != os.environ["WEB_SECRET"]:
		response.status = 403
		return "Not allowed"

@get("/")
def index():
	return static_file("index.html", root=os.environ["STATIC_ROOT"])

# passing some env variables to the client in form of js module
@get("/js/config.js")
def public_config():
	config_data = {
		"bot_username": os.environ["BOT_USERNAME"],
		"bot_appname": os.environ["BOT_APPNAME"],
	}
	
	response.content_type = "application/javascript"
	return f"const config = {json.dumps(config_data)};\nexport default config"

@get("/<filepath:path>")
def static(filepath):
	return static_file(filepath, root=os.environ["STATIC_ROOT"])

def init():
	# loading .env
	dotenv.load_dotenv()
	
	# setting global paths
	base_path = Path(__file__).parent.parent
	os.environ["BASE_PATH"] = str(base_path)
	os.environ["STATIC_ROOT"] = str(base_path / "src" / "static")
	os.environ["DB_PATH"] = str(base_path / "data" / "db.sqlite")
	
	# creating data dir and db file
	data_path = base_path / "data"
	data_path.mkdir(exist_ok=True)
	init_database()
	
	# initializing button shown in private chats
	tgapi.call("setChatMenuButton", {
		"menu_button": json.dumps({
			"type": "web_app",
			"text": "Editor",
			"web_app": {
				"url": os.environ["APP_HOST"]
			}
		})
	})

if __name__ == "__main__":
	init()
	run(host=os.environ["SERVER_HOST"], port=os.environ["SERVER_PORT"])
