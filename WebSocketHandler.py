import uuid

import tornado.websocket

clients = []

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        if self not in clients:
            self.id = uuid.uuid4()
            clients.append(self)

    def on_message(self, message):
        self.write_message(u"You said are : " + str(self.id) + " and you said " + message)

    def on_close(self):
        if self in clients:
            clients.remove(self)
