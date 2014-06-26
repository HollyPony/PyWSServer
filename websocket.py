import Settings
import WebSocketHandler

import tornado.web

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/ws',  WebSocketHandler.WebSocketHandler),
        ]
        tornado.web.Application.__init__(self, handlers)



if __name__ == '__main__':
    app = Application()

    app.listen(Settings.WSPORT)
    tornado.ioloop.IOLoop.instance().start()
