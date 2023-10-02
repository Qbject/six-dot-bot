import requests, json, io, os, hashlib, hmac
import util
from urllib.parse import parse_qsl

class TgBotApiError(Exception):
	pass

def call(method, params={}, files={}):
	token = os.environ["BOT_TOKEN"]
	
	resp = requests.post(
		f"https://api.telegram.org/bot{token}/{method}",
		data=params,
		files=files
	)
	tg_reply = json.loads(resp.text)
	
	if (not "result" in tg_reply) or (not tg_reply["ok"]) or (not resp.ok):
		raise TgBotApiError("result['ok'] == False:\n" \
			+ json.dumps(tg_reply, indent="\t"))
	
	return tg_reply["result"]

def send_message(chat_id, text="", as_html=False, file_path=None,
		file_id=None, file_url=None, file_bytes=None, file_type="document",
		**params):
	
	params["chat_id"] = int(chat_id)
	if as_html: params["parse_mode"] = "HTML"
	
	if any([file_path, file_id, file_url, file_bytes]):
		method = f"send{util.ucfirst(file_type)}"
		params["caption"] = text
		params[file_type.lower()] = file_id or file_url or "attach://file"
	else:
		method = "sendMessage"
		params["text"] = text
	
	file_io = io.BytesIO()
	if file_path: file_io = open(file_path, "rb")
	elif file_bytes: file_io = io.BytesIO(file_bytes)
	
	with file_io:
		sent_msg = call(method, params, files={"file": file_io})
	
	return sent_msg

def parse_webapp_init_data(init_data_str):
	# verification: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
	url_params = dict(parse_qsl(init_data_str))

	hash_value = url_params.get("hash")
	del url_params["hash"]
	sorted_params = sorted(url_params.items())

	data_check_string = "\n".join([f"{key}={value}" for key, value
		in sorted_params])

	secret = hmac.new(b"WebAppData", os.environ["BOT_TOKEN"].encode(),
		hashlib.sha256)
	calculated_hash = hmac.new(secret.digest(), data_check_string.encode(),
		hashlib.sha256).hexdigest()

	if calculated_hash != hash_value: return None # not valid
	
	# parsing
	init_data = dict(parse_qsl(init_data_str))
	for field_name in ("user", "receiver", "chat"):
		if field_name not in init_data: continue
		init_data[field_name] = json.loads(init_data[field_name])
	return init_data