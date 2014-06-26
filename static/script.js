"use strict";

/**
 * Created by Raymond Barre on 30/04/2014.
 */
window.addEventListener("load", function(event) {
    var chatLog = document.getElementById('chatLog');
    var userList = document.getElementById('userList');
    var userInput = document.getElementById('userInput');
    var remoteServer = document.getElementById('remoteServer');
    var userName = document.getElementById('userName');
    var connectButton = document.getElementById('connect');
    var disconnectButton = document.getElementById('disconnect');
    var statusSpan = document.getElementById('status');
    var sendTextButton = document.getElementById('sendText');

    if (!("WebSocket" in window)) {
        $('#chatLog, input, button').fadeOut("slow");
        $('<p>Oh no, you need a browser that supports WebSockets. How about <a href="http://www.google.com/chrome">Google Chrome</a>?</p>').appendTo('#container');
    } else {

        var socket;

        disconnectButton.disabled = true;
        sendTextButton.disabled = true;
        userInput.disabled = true;
        statusSpan.textContent = "Déconnecté";

        connectButton.addEventListener('click', function (event) {

            try {
                console.log(userName.value);
                connectButton.disabled = true;
                remoteServer.disabled = true;
                userName.disabled = true;

                if (remoteServer.value)
                    socket = new WebSocket(remoteServer.value);
                else
                    socket = new WebSocket(remoteServer.getAttribute("placeholder"));

                socket.addEventListener('open', function (event) {
                    sendTextButton.disabled = false;
                    userInput.disabled = false;
                    disconnectButton.disabled = false;
                    statusSpan.textContent = "Connecté";
                    messageEvent('Connected');
                });

                socket.addEventListener('close', function (event) {
                    connectButton.disabled = false;
                    remoteServer.disabled = false;
                    userName.disabled = false;
                    sendTextButton.disabled = true;
                    userInput.disabled = true;
                    userInput.textContent = "";
                    disconnectButton.disabled = true;
                    statusSpan.textContent = "Déconnecté";

                    var element = document.getElementById("userList");
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }


                    messageError(event.code + " -> " + event.reason);
                    messageEvent('Disconnected');
                });

                socket.addEventListener('message', function (event) {

                    try {
                        var msgObj = JSON.parse(event.data);
                        if (msgObj.message) {
                            messageReceived(msgObj.message);
                        } else if (msgObj.userList) {
                            msgObj.userList.forEach(function (user) {
                                var li = document.createElement('dt');
                                li.textContent = user.name;
                                li.id = user.id;

                                userList.appendChild(li);
                            });
                        } else if (msgObj.userConnected) {
                            var user = msgObj.userConnected;
                            var li = document.createElement('dt');
                            li.textContent = user.name;
                            li.id = user.id;

                            userList.appendChild(li);
                        } else if (msgObj.userDisconnected) {
                            var element = document.getElementById(msgObj.userDisconnected.id);
                            element.parentNode.removeChild(element);
                        } else if (msgObj.userChangeName) {
                            var element = document.getElementById(msgObj.userChangeName.id);
                            element.textContent = msgObj.userChangeName.name;
                        }
                    } catch (e if e instanceof SyntaxError) {
                        messageWarning(event.data);
                    }
                });

                disconnectButton.addEventListener('click', function (event) {
                    socket.close();
                });

            } catch (exception) {
                connectButton.disabled = false;
                remoteServer.disabled = false;
                userName.disabled = false;
                messageError('Error: ' + exception)
            }
        });

        sendTextButton.addEventListener("click", function (event) {
            send();
        });

        userInput.addEventListener('keypress', function (event) {
            if (event.keyCode == '13') {
                send();
            }
        });
    }


    function send() {
        var text = userInput.value;

        if (text != '') {
            try {
                socket.send(text);
            } catch (exception) {
                messageWarning('');
            }
        }

        userInput.value = "";
    }

    function createP(content, className) {
        var p = document.createElement('p');
        p.appendChild(content);
        p.className = className;
        return p;
    }

    function createSpan(content, className) {
        var span = document.createElement('span');
        span.appendChild(content);
        span.className = className;
        return span;
    }

    function messageWarning(msg) {
        appendMessage(createP(document.createTextNode(msg), 'warning'));
    }

    function messageEvent(msg) {
        appendMessage(createP(document.createTextNode(msg), 'event'));
    }

    function messageError(msg) {
        appendMessage(createP(document.createTextNode(msg), 'error'));
    }

    function messageReceived(msg) {
        var p = createP(createSpan(document.createTextNode(msg.from.name), 'userName'), 'messageReceived');
        p.appendChild(document.createTextNode(msg.content));
        appendMessage(p);
    }

    function appendMessage(blocToAppend) {
        chatLog.appendChild(blocToAppend);
        chatLog.scrollTop = chatLog.scrollHeight;
    }
})