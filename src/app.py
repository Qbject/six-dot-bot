from bottle import static_file, response, get, run, request, post, default_app
from pathlib import Path
import os
import sys
import json
import dotenv
from util import init_database
import tgapi
import rest_api # adds additional route handles upon importing

# setting global paths
base_path = Path(__file__).parent.parent
os.environ["BASE_PATH"] = str(base_path)
os.environ["STATIC_ROOT"] = str(base_path / "src" / "static")
os.environ["DB_PATH"] = str(base_path / "data" / "db.sqlite")

# loading .env
os.chdir(base_path)
dotenv.load_dotenv()

# Telegram updates
@post("/api/handle_tg_update")
def handle_tg_update():
	secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
	if secret != os.environ["TG_SECRET_TOKEN"]:
		response.status = 403
		return "Not allowed"
	
	update = request.json
	if "message" not in update: return
	if update["message"]["text"] == "/start":
		greeting_msg = f"""
👋 Welcome to the {os.environ["BOT_DISPLAY_NAME"]}!

Here's what I can do for you:

📝 Create Rich Pages: I can help you create visually appealing pages using the power of MiniApps. You can easily design and edit your own interactive pages with a simple drag-and-drop interface.

📤 Share Pages: Once you've created your masterpiece, I'll generate link that open your MiniApp page. Share these links with your friends on Telegram and amaze them with your creativity!

🚀 Let's get started! To create a new page, just press the button below and I'll guide you through the process.

Let's embark on a creative journey! ✨
	""".strip()
	message_button = json.dumps({
		"inline_keyboard": [[{
			"text": "Open Editor",
			"web_app": {
				"url": os.environ["APP_HOST"]
			}
		}]],
	})
	
	tgapi.send_message(update["message"]["chat"]["id"], greeting_msg,
		reply_markup=message_button)

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
	# creating data dir and db file
	data_path = base_path / "data"
	data_path.mkdir(exist_ok=True)
	init_database()
	
	# setting up button shown in private chats
	tgapi.call("setChatMenuButton", {
		"menu_button": json.dumps({
			"type": "web_app",
			"text": "Editor",
			"web_app": {
				"url": os.environ["APP_HOST"]
			}
		})
	})
	
	# setting Telegram update listening endpoint
	webhook_url = f"{os.environ['APP_HOST']}/api/handle_tg_update"
	tgapi.call("setWebhook", {
		"url": webhook_url,
		"secret_token": os.environ["TG_SECRET_TOKEN"]
	})

application = default_app()

if __name__ == "__main__":
	if "--init" in sys.argv:
		init()
	if "--run" in sys.argv:
		run(host=os.environ["SERVER_HOST"], port=os.environ["SERVER_PORT"])
