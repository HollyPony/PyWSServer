import os
dirname = os.path.dirname(__file__)

HTTPPORT = int(os.environ.get("PORT", 5000))
WSPORT = HTTPPORT#8080

STATIC_PATH = os.path.join(dirname, 'static')
TEMPLATE_PATH = os.path.join(dirname, 'templates')
