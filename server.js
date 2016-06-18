/**
 *
 */
var https  = require( 'https' ),
    url     = require( 'url' ),
    path    = require( 'path' ),
    fs      = require( 'fs' );

var options = {
    key: fs.readFileSync('ssl/videocenter/videocenter_co_kr.key'),

    cert: fs.readFileSync('ssl/videocenter/videocenter_co_kr.crt-bundle'),

 //   cert: fs.readFileSync('ssl/videocenter/videocenter_co_kr.crt'),
 //   ca: fs.readFileSync('ssl/videocenter/videocenter_co_kr.ca-bundle')

};

/*
var options = {
    key: fs.readFileSync('ssl/onfis/onfis_com.key'),
    cert: fs.readFileSync('ssl/onfis/onfis_com.crt.ca-bundle')
};
*/



var count_request = 0;
function serverHandler(request, response) {
    var uri = url.parse(request.url).pathname;
    var www_path = path.join(process.cwd(), 'www');
    var filename = path.join(www_path, uri);

    count_request ++;
    //console.log('count request : ' + count_request );
    //console.log(www_path);
    //console.log(filename);
    var stats;

    try {
        stats = fs.lstatSync(filename);
    } catch (e) {
        response.writeHead(404, {
            'Content-Type': 'text/plain'
        });
        response.write('404 Not Found: ' + path.join('/', uri) + '\n');
        response.end();
        return;
    }

    if (fs.statSync(filename).isDirectory()) {
        filename += '/index.html';
    }

    fs.readFile(filename, 'binary', function(err, file) {
        if (err) {
            response.writeHead(500, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + path.join('/', uri) + '\n');
            response.end();
            return;
        }
        response.writeHead(200);
        response.write(file, 'binary');
        response.end();
    });
}
var app = https.createServer(options, serverHandler);

app.listen(10443);



var videoCenter = require('./video-center-3.js');


var count_signaling_server = 0;
require('./Signaling-Server.js')(app, videoCenter, function(socket) {
    count_signaling_server ++;
    //console.log('signaling server : ' + count_signaling_server);
    //try {
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

        videoCenter.listen( socket );

    //} catch (e) {}
});
