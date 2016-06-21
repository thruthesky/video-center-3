/**
 * 로컬 임시 웹 서버
 * HTTPS 로 접속을 하기 위한 단순한 도구
 */
var https  = require( 'https' ),
    url     = require( 'url' ),
    path    = require( 'path' ),
    fs      = require( 'fs' );

var options = {
    key: fs.readFileSync(path.join(__dirname, 'ssl/onfis/onfis_com.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl/onfis/onfis_com.crt')),
    ca: fs.readFileSync(path.join(__dirname, 'ssl/onfis/onfis_com.ca-bundle'))
};

var count_request = 0;
function serverHandler(request, response) {
    var uri = url.parse(request.url).pathname;
    var www_path = path.join(process.cwd(), 'www');
    var filename = path.join(www_path, uri);

    count_request ++;
    console.log('count request : ' + count_request );
    //console.log(www_path);
    console.log(filename);
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
app.listen(1443);