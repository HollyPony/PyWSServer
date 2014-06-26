import uuid

import cyclone.websocket

clients = []


class WebSocketHandler(cyclone.websocket.WebSocketHandler):
    def connectionMade(self):
        if self not in clients:
            self.id = uuid.uuid4()
            clients.append(self)

    def messageReceived(self, message):
        self.sendMessage(u"You said: " + message)
        for client in clients:
            if client != self:
                client.sendMessage(str(self.id) + " said: " + message)

    def connectionLost(self):
        if self in clients:
            clients.remove(self)
