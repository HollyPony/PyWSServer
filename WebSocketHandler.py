import uuid
import json
import time
import collections

import cyclone.websocket

clients = []
history = collections.deque(100*[None], 100)


class WebSocketHandler(cyclone.websocket.WebSocketHandler):
    def __init__(self, application, request, **kwargs):
        super(WebSocketHandler, self).__init__(application, request, **kwargs)

        self.id = uuid.uuid4()
        self.name = None
        self.logged = False

    # ------------------------------------------------------------------------------------------------------------------
    # Own Method
    # ------------------------------------------------------------------------------------------------------------------

    def send(self, message):
        message["time"] = time.time()
        self.sendMessage(json.dumps(message))

    # ------------------------------------------------------------------------------------------------------------------
    # Received Method From Client Logic
    # ------------------------------------------------------------------------------------------------------------------

    def treatmessagefromclient(self, message):
        # Test message validity
        if message is None:
            return

        jmessage = json.loads(message)
        if jmessage is None or "method" not in jmessage:
            return

        method = jmessage["method"]

        if "ping" == method:
            pass

        elif "hello" == method:
            self.hello(jmessage)

        elif "message" == method:
            self.message(jmessage)

        elif "nick" == method:
            self.nick(jmessage)

        elif "history" == method:
            self.history()

    def hello(self, message):
        # Test if User is valid
        name = message["name"]
        if name == "":
            self.send({"method": "rejected"})
            return

        self.name = name
        self.logged = True
        clients.append(self)
        self.send({"method": "accepted",
                   "userId": str(self.id)})

        # Send client list
        self.send({"method": "userList",
                   "content": list({"id": str(client.id), "name": client.name} for client in clients)})

        method = {"method": "userConnected",
                  "id": str(self.id),
                  "name": self.name,
                  "time": time.time()}
        for client in (x for x in clients if x is not self):
            client.send(method)

    def message(self, message):
        msg = {"method": "message",
               "content": message["content"],
               "from": {"id": str(self.id),
                        "name": self.name}}
        history.appendleft(msg)

        for client in clients:
            client.send(msg)

    def nick(self, message):
        old_name = self.name
        new_name = message["newName"]

        self.name = new_name

        method = {"method": "nick",
                  "userId": str(self.id),
                  "oldName": old_name,
                  "newName": new_name}

        for client in clients:
            client.send(method)

    def history(self):
        self.send({"method": "history",
                   "content": list(x for x in list(history) if x is not None)[::-1]})

    # ------------------------------------------------------------------------------------------------------------------
    # WEBSOCKET IMPLEMENTATION
    # ------------------------------------------------------------------------------------------------------------------

    def connectionMade(self):
        if self not in clients:
            self.logged = False

    def messageReceived(self, message):
        self.treatmessagefromclient(message)

    def connectionLost(self, reason):
        # Notify i am disconnected
        msg = {"method": "userDisconnected",
               "id": str(self.id)}

        for client in (client for client in clients if client is not self):
            client.send(msg)

        if self in clients:
            clients.remove(self)