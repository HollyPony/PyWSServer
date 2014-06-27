"use strict";

/**
 * Created by Raymond Barre on 30/04/2014.
 */

window.addEventListener("load", function(event) {
    var chatLog = $('#chatLog');
    var userList = $('#userList');
    var userInput = $('#userInput');
    var remoteServer = $('#remoteServer');
    var userName = $('#userName');
    var connectButton = $('#connect');
    var disconnectButton = $('#disconnect');
    var sendTextButton = $('#sendText');

    if (!("WebSocket" in window)) {
        $('#chatLog, input, button').fadeOut("slow");
        $('<p>Oh no, you need a browser that supports WebSockets. How about <a href="http://www.google.com/chrome">Google Chrome</a>?</p>').appendTo('#container');
    } else {

        var socket;

        disconnectButton.prop('disabled',  true);
        sendTextButton.prop('disabled',  true);
        userInput.prop('disabled',  true);

        connectButton.click( function (event) {

            var intervalID = null;

            var div = $("#userName").parents("div.form-group");
            if (userName.val() == '') {
                div.removeClass("has-success");
                div.addClass("has-error");

                return false;
            } else {
                div.removeClass("has-error");
                div.addClass("has-success");
            }

            try {
                connectButton.prop('disabled',  true);
                remoteServer.prop('disabled',  true);
                userName.prop('disabled',  true);

                if (remoteServer.val())
                    socket = new WebSocket(remoteServer.val());
                else
                    socket = new WebSocket(remoteServer.attr("placeholder"));

                socket.onopen = function (event) {
                    sendTextButton.prop('disabled',  false);
                    userInput.prop('disabled',  false);
                    disconnectButton.prop('disabled',  false);

                    // I'm glad to meet you, my name is ...
                    socket.send(JSON.stringify({"hello": {"name": userName.val()}}));

                    messageEvent('Connected');
                };

                socket.onclose = function (event) {
                    clearInterval(intervalID);
                    connectButton.prop('disabled',  false);
                    remoteServer.prop('disabled',  false);
                    userName.prop('disabled',  false);
                    sendTextButton.prop('disabled',  true);
                    userInput.prop('disabled',  true);
                    userInput.textContent = "";
                    disconnectButton.prop('disabled',  true);

                    userList.empty();

                    console.log(event.code);
                    messageEvent('Disconnected');
                };

                socket.onmessage = function (event) {
                    try {
                        var msgObj = JSON.parse(event.data);
                        if (msgObj == "accepted") {
                            connected();
                        } else if (msgObj == "rejected") {
                            socket.close();
                        } else if (msgObj.message) {
                            messageReceived(msgObj.message);
                        } else if (msgObj.userList) {
                            msgObj.userList.forEach(function (user) {
                                userList.append($(document.createElement('dt')).text(user.name).attr('id', user.id));
                                intervalID = setInterval(function(){ping();}, 40000);
                            });
                        } else if (msgObj.userConnected) {
                            var user = msgObj.userConnected;

                            userList.append($(document.createElement('dt')).text(user.name).attr('id', user.id));
                        } else if (msgObj.userDisconnected) {
                            var element = document.getElementById(msgObj.userDisconnected.id);
                            element.parentNode.removeChild(element);
                        } else if (msgObj.userChangeName) {
                            var element = document.getElementById(msgObj.userChangeName.id);
                            element.textContent = msgObj.userChangeName.name;
                        }
                    } catch (e) {
                        messageWarning(event.data);
                    }
                };

                disconnectButton.click(function (event) {
                    socket.close();
                });

            } catch (exception) {
                connectButton.prop('disabled',  false);
                remoteServer.prop('disabled',  false);
                userName.prop('disabled',  false);
                messageError('Error: ' + exception)
                clearInterval(intervalID);
            }
        });

        sendTextButton.click(function (event) {
            send();
        });

        userInput.keypress(function (event) {
            if (event.keyCode == '13') {
                send();
            }
        });
    }

    function ping() {
        socket.send(JSON.stringify("ping"));
    }

    function send() {
        var text = userInput.val();

        if (text != '') {
            try {
                socket.send(JSON.stringify({"message": {"content": text}}));
            } catch (exception) {
                messageWarning('');
            }
        }

        userInput.val("");
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
        appendMessage(createP(document.createTextNode(msg), 'text-warning'));
    }

    function messageEvent(msg) {
        appendMessage(createP(document.createTextNode(msg), 'text-muted'));
    }

    function messageError(msg) {
        appendMessage(createP(document.createTextNode(msg), 'text-danger'));
    }

    function messageReceived(msg) {
        var p = createP(createSpan(document.createTextNode(msg.from.name), 'userName'), 'messageReceived');
        p.appendChild(document.createTextNode(msg.content));
        appendMessage(p);
    }

    function appendMessage(blocToAppend) {
        chatLog.append(blocToAppend);
        chatLog.scrollTop = chatLog.scrollHeight;
    }
})
