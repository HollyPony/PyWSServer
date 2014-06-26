import Settings

import os
import json

import tornado.ioloop
import tornado.web
import tornado.httpserver

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/',    IndexHandler),
            (r'/api', ApiHandler),
            (r'/favicon.ico', tornado.web.StaticFileHandler, {'path': "./"}),
        ]
        settings = {
            "WSServerUrl": "ws://localhost:" + str(Settings.WSPORT) + "/ws",
            "template_path": Settings.TEMPLATE_PATH,
            "static_path": Settings.STATIC_PATH,
        }
        tornado.web.Application.__init__(self, handlers, **settings)

class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

class ApiHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self, *args):
        self.finish()
        id = self.get_argument("id")
        value = self.get_argument("value")
        data = {"id": id, "value" : value}
        data = json.dumps(data)
        for c in clients:
            c.write_message(data)

    @tornado.web.asynchronous
    def post(self):
        pass

if __name__ == '__main__':
    app = Application()

    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(Settings.HTTPPORT)
    tornado.ioloop.IOLoop.instance().start()
