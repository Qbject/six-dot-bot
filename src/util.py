import traceback

def sanitize_html(text):
	text = text.replace("&", "&amp;")
	text = text.replace("<", "&lt;")
	text = text.replace(">", "&gt;")
	return text

def ucfirst(input_str):
	if input_str:
		return input_str[0].upper() + input_str[1:]
	return input_str

def get_err(): # shorter version of traceback.format_exc
	return traceback.format_exc()
