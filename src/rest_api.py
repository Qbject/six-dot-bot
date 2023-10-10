from bottle import response, request, get, post, delete
import pages
from util import get_schema_template
import tgapi
import traceback

def mini_app_api(request_handler):
	# decorator handling errors and Web App InitData validation+parsing
	def wrapper(*args, **kwargs):
		def on_error(code):
			print(f"Request handling error: {request.method} {request.url}")
			print(f"Traceback:\n{traceback.format_exc()}")

			response.status = code
			return {"ok": False, "result": None}
		
		try:
			init_data_raw = request.headers.get("X-Tg-Init-Data")
			if init_data_raw:
				init_data = tgapi.parse_webapp_init_data(init_data_raw)
			else:
				init_data = None
			
			result = request_handler(*args, **kwargs, init_data=init_data)
			response.status = 200
			return {"ok": True, "result": result}
		
		except FileNotFoundError: return on_error(404)
		except PermissionError: return on_error(403)
		except Exception: return on_error(500)
		
	return wrapper

# create new page
@post("/api/pages")
@mini_app_api
def create_new_page(init_data):
	if not init_data: raise PermissionError
	
	is_onboarding = request.json and request.json.get("onboarding")
	schema, title = get_schema_template(is_onboarding)
	
	page_id = pages.create(init_data["user"]["id"], schema, title)
	return pages.get_by_id(page_id)

# update a page
@post("/api/pages/<pageId>")
@mini_app_api
def update_existing_page(pageId, init_data):
	if not init_data: raise PermissionError
	
	# checking if the user owns this page
	page = pages.get_by_id(pageId)
	if not page: raise FileNotFoundError
	if page["ownerId"] != init_data["user"]["id"]:
		raise PermissionError
	
	page_data = {
		"schema": request.json["schema"],
		"title": request.json["title"],
	}
	pages.update(pageId, page_data)

# delete a page
@delete("/api/pages/<pageId>")
@mini_app_api
def delete_page_by_id(pageId, init_data):
	if not init_data: raise PermissionError
	
	# checking if the user owns this page
	page = pages.get_by_id(pageId)
	if not page: raise FileNotFoundError
	if page["ownerId"] != init_data["user"]["id"]:
		raise PermissionError
	
	pages.delete(pageId)

# list user pages (some fields are omitted)
@get("/api/pages/my")
@mini_app_api
def list_user_pages(init_data):
	if not init_data: raise PermissionError
	
	return pages.get_by_owner(init_data["user"]["id"])

# retrieve a page
@get("/api/pages/<pageId>")
@mini_app_api
def retrieve_page_by_id(pageId, init_data):
	page = pages.get_by_id(pageId)
	if not page: raise FileNotFoundError
	return page