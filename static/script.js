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
    var toggleConnectionButton = $('#toggleConnectionButton');
    var sendTextButton = $('#sendText');

    var intervalID = null;

    function connected() {
        intervalID = setInterval(function(){ping();}, 40000);
        chatLog.prop('disabled', true);
        userList.prop('disabled', true);
        remoteServer.prop('disabled', true);
        userName.prop('disabled', true);

        userInput.prop('disabled', false);
        sendTextButton.prop('disabled', false);

        toggleConnectionButton.text('Disconnect');

        messageEvent('Connected');
    }

    function disconnected() {
        clearInterval(intervalID);
        chatLog.prop('disabled', false);
        userList.prop('disabled', false);
        remoteServer.prop('disabled', false);
        userName.prop('disabled', false);

        userInput.prop('disabled', true);
        sendTextButton.prop('disabled', true);

        toggleConnectionButton.text('Connect');

        messageEvent('Disconnected');
    }

    if (!("WebSocket" in window)) {
        $('#chatLog, input, button').fadeOut("slow");
        $('<p>Oh no, you need a browser that supports WebSockets. How about <a href="http://www.google.com/chrome">Google Chrome</a>?</p>').appendTo('#container');
    } else {

        var socket;

        disconnected();

        toggleConnectionButton.click( function (event) {

            if (socket) {
                socket.close();
                return;
            }

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
                if (remoteServer.val())
                    socket = new WebSocket(remoteServer.val());
                else
                    socket = new WebSocket(remoteServer.attr("placeholder"));

                socket.onopen = function (event) {
                    socket.send(JSON.stringify({"hello": {"name": userName.val()}}));
                };

                socket.onclose = function (event) {
                    userList.empty();

                    disconnected();
                    socket = null;
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

            } catch (exception) {
                messageError('Error: ' + exception);
                disconnected();
                socket = null;
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
        chatLog.animate({scrollTop: chatLog[0].scrollHeight}, 'slow');
    }
})
