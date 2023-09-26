import tgapi, database
import os, json
from dotenv import load_dotenv

load_dotenv()

def init():
    app_host = os.environ["APP_HOST"].rstrip("/")
    
    tgapi.call("setChatMenuButton", {
        "menu_button": json.dumps({
            "type": "web_app",
            "text": "Open Editor",
            "web_app": {
                "url": f"{app_host}/miniapp"
            }
        })
    })
    
    database.create_database()

if __name__ == "__main__":
    init()