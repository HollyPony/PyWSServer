import uuid
import json
import time

import cyclone.websocket

import User

clients = {}


class WebSocketHandler(cyclone.websocket.WebSocketHandler):
    def connectionMade(self):
        if self not in clients:
            self.id = uuid.uuid4()
            clients[self] = None

    def messageReceived(self, message):
        jmessage = json.loads(message)
        if "ping" in jmessage:
            pass

        elif "hello" in jmessage:
            # Test if User is valid
            clients[self] = User.User(jmessage["hello"]["name"])
            self.sendMessage(json.dumps("accepted"))

            # Send client list
            jclients = []
            for client, user in clients.items():
                jclients.append({"id": str(client.id),
                                 "name": user.name})
            msg = json.dumps({"userList": jclients})
            self.sendMessage(msg)

            # Notify client connection
            msg = json.dumps({"userConnected": {"id": str(self.id),
                                                "name": clients[self].name}})
            for client in clients:
                if client is not self:
                    client.sendMessage(msg)

        if clients[self] is None:
            self.sendMessage(json.dumps('rejected'))
            clients.pop(self)

        if "message" in jmessage:
            msg = json.dumps({"message": {"content": jmessage["message"]["content"],
                                          "from": {"id": str(self.id),
                                                   "name": clients[self].name},
                                          "time": time.time()}})
            for client in clients:
                client.sendMessage(msg)

    def connectionLost(self, reason):
        # Notify i am disconnected
        msg = json.dumps({"userDisconnected": {"id": str(self.id)}})
        for client in clients:
            if client is not self:
                client.sendMessage(msg)

        if self in clients:
            clients.pop(self)
