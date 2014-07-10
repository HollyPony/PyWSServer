import uuid
import json
import time

import cyclone.websocket

clients = []
history = []


class WebSocketHandler(cyclone.websocket.WebSocketHandler):

    def __init__(self, application, request, **kwargs):
        super(WebSocketHandler, self).__init__(application, request, **kwargs)

        self.id = uuid.uuid4()
        self.name = None
        self.logged = False

    def connectionMade(self):
        if self not in clients:
            self.logged = False

    def messageReceived(self, message):
        if message is None:
            return

        jmessage = json.loads(message)
        if jmessage is None:
            return

        if "ping" in jmessage:
            pass

        elif "hello" in jmessage:
            # Test if User is valid
            self.name = jmessage["hello"]["name"]
            self.logged = True

            msg = {"userConnected": {"id": str(self.id),
                                     "name": self.name},
                   "time": time.time()}
            for client in clients:
                client.send(msg)

            clients.append(self)

            # Send client list
            jclients = []
            for client in clients:
                jclients.append({"id": str(client.id),
                                 "name": client.name})
            msg = {"userList": jclients,
                   "time": time.time()}
            self.send(msg)
            self.send({"accepted": str(self.id),
                       "time": time.time()})


        if self.logged is False:
            self.send({"rejected": str(self.id),
                       "time": time.time()})
            clients.remove(self)

        elif "message" in jmessage:
            msg = {"message": {"content": jmessage["message"]["content"],
                               "from": {"id": str(self.id),
                                        "name": self.name}},
                   "time": time.time()}
            history.append(msg)

            for client in clients:
                client.send(msg)

        elif "nick" in jmessage:
            self.name = jmessage["nick"]["newName"]
            self.send({"nick": self.name,
                       "time": time.time()})

        elif "history" in jmessage:
            self.send({"history": history,
                       "time": time.time()})

    def connectionLost(self, reason):
        # Notify i am disconnected
        msg = json.dumps({"userDisconnected": {"id": str(self.id)}})
        for client in clients:
            if client is not self:
                client.sendMessage(msg)

        if self in clients:
            clients.remove(self)

    def send(self, message):
        self.sendMessage(json.dumps(message))