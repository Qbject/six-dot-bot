from bottle import route, run, static_file, response
from pathlib import Path
import os
import dotenv

base_dir = Path(__file__).parent
webroot = base_dir.parent / "public" / "miniapp"
dotenv.load_dotenv()

@route("/miniapp")
def index():
	return static_file("index.html", root=webroot)

@route("/miniapp/<filepath:path>")
def static(filepath):
	return static_file(filepath, root=webroot)

@route("/handle_update")
def handle_update(secret):
	if secret != os.environ["WEB_SECRET"]:
		response.status = 403
		return "Not allowed"

def run_local():
	run(host=os.environ["SERVER_HOST"], port=os.environ["SERVER_PORT"])
