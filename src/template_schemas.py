import json

default = json.dumps({
    "children": [
        {
            "typeName": "heading",
            "props": {
                "text": "You just created a new page!"
            }
        },
        {
            "typeName": "paragraph",
            "props": {
                "text": "TODO: explain some basics here?"
            }
        }
    ]
})

onboarding = json.dumps({
    "children": [
        {
            "typeName": "heading",
            "props": {
                "text": "This is onboarding page!"
            }
        },
        {
            "typeName": "paragraph",
            "props": {
                "text": "TODO: explain some basics here?"
            }
        }
    ]
})