var ws = require('nodejs-websocket'); //
var server = ws.createServer(socketConnection).listen(3001);
console.log('Server gestart')
function socketConnection(conn) {
    console.log('New connection!');
    conn.on('text', function(msg) {
        console.log('Received: ', msg);
        server.connections.forEach(function(conn) {
            conn.sendText('Received: ' + msg + '! (' + new Date() + ')');
        })
    })
    conn.on('close', function(code, reason) {
        console.log('Connection closed');
    })
}