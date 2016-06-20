
var https = require('https');
var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();

var options = {
    key: fs.readFileSync(path.join(__dirname, 'ssl/withcenter.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl/withcenter.crt'))
};
var server = https.createServer(options, app);

server.listen(1234);

app.get('/', express.static('www') );

app.use('/', express.static(__dirname + '/www'));
app.use('/music', express.static(__dirname + '/music'));
app.use('/private', express.static(__dirname + '/private'));



require('./../Signaling-Server.js')(app, function(socket) {
    try {
        var params = socket.handshake.query;

        // "socket" object is totally in your own hands!
        // do whatever you want!

        // in your HTML page, you can access socket as following:
        // connection.socketCustomEvent = 'custom-message';
        // var socket = connection.getSocket();
        // socket.emit(connection.socketCustomEvent, { test: true });

        if (!params.socketCustomEvent) {
            params.socketCustomEvent = 'custom-message';
        }

        socket.on(params.socketCustomEvent, function(message) {
            try {
                socket.broadcast.emit(params.socketCustomEvent, message);
            } catch (e) {}
        });
    } catch (e) {}
});
