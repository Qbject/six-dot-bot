import hashlib, os, hmac
from urllib.parse import parse_qsl

def sanitize_html(text):
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    return text

def ucfirst(input_str):
    if input_str:
        return input_str[0].upper() + input_str[1:]
    return input_str

def parse_init_data(telegram_init_data):
    return dict(parse_qsl(telegram_init_data))

# initData security verification
# https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
def validate_init_data(telegram_init_data):
    url_params = parse_init_data(telegram_init_data)

    hash_value = url_params.get('hash')
    del url_params['hash']
    sorted_params = sorted(url_params.items())

    data_check_string = '\n'.join([f'{key}={value}' for key, value in sorted_params])

    secret = hmac.new(b"WebAppData", os.environ["BOT_TOKEN"].encode(), hashlib.sha256)
    calculated_hash = hmac.new(secret.digest(), data_check_string.encode(), hashlib.sha256).hexdigest()

    return calculated_hash == hash_value



