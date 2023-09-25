import requests, json, re, io, os
import util

# TODO: refactor
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

def delete_msg(chat_id, msg_id):
	return call("deleteMessage", {
		"chat_id": chat_id,
		"message_id": msg_id
	})

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