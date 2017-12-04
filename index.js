const url = require('url');
const fs = require('fs');
const ws = require('nodejs-websocket'); //
const UserList = require('./src/UserList')

var server = ws.createServer(socketConnection).listen(3001);

// Set up server ping pong
// each 30 secs ping clients and listen for pong response
// to verify that the client(s) are still connected:
setInterval(function ping() {
    if (server.connections.length > 0) {
        server.connections.forEach(function (eachConn) {
            eachConn.sendPing()
        })
    }
}, 30000);


console.log('*** Server gestart ***')

var userList = new UserList()

function getUsernameFromURL(conn) {
    var urlObj = url.parse(conn.path, true)
    var username = urlObj.query.username
    // console.log('Username', username);
    return username
}

function socketConnection(conn) {

    // Parse the username from the new user from the server URL:
    var username = getUsernameFromURL(conn)

    // Add the new user to the userlist
    userList.addUser(conn.key, username)

    console.log('*** ' + username + ' connected', conn.key)

    // Flatten the userlist so it can be sent back to the user:
    var users = userList.flattenUserList()
    var message = createMessage('', 'connect', {'key': conn.key, 'users': users})

    // send the 'key' and the userlist back to the client,
    // when that is done, notify the other connected
    // users about the newly connected user.

    conn.sendText(message, function (e) {
        // console.log(e)

        // notify other connected clients about the newly connected user:
        var notificationMsg = createMessage(conn.key, 'new-user', {'username': username})
        server.connections.forEach(function (eachConn) {
            eachConn.sendText(notificationMsg, function (e) {
                // console.log(e)
            })
        })

    })

    conn.on('text', function (msg) {

        // console.log('Received: ', msg);

        var messageObject = JSON.parse(msg)
        var isWhispering = false
        switch (messageObject.type) {
            case 'set-avatar':
                var u = userList.findUser(conn.key)
                if (u) {
                    u.avatar = messageObject.data.image
                }
                break
            case 'set-username':
                var u = userList.findUser(conn.key)
                if (u) {
                    u.username = messageObject.data.username
                }
                console.log('set-username', u.username)
                break

            case 'pos':
                var u = userList.findUser(conn.key)
                if (u) {
                    u.x = messageObject.data.x
                    u.y = messageObject.data.y
                }
                console.log('set-pos', u.x, u.y)
                break

            case 'msg':
                // console.log('messageObject.data.whisperTo', messageObject.data.whisperTo)
                if (messageObject.data.whisperTo !== undefined) isWhispering = true
                break
            case 'client-ping':
                conn.sendText(createMessage(conn.key, 'server-pong', {}))
                // exit this routine:
                return
                break

            default:
                break
        }

        messageObject.sender = conn.key

        server.connections.forEach(function (eachConn) {
            if (isWhispering) {
                if (messageObject.data.whisperTo == eachConn.key || eachConn.key == messageObject.sender) {
                    eachConn.sendText(JSON.stringify(messageObject))
                    console.log('whispered to somebody...')
                }
            } else {
                eachConn.sendText(JSON.stringify(messageObject))
            }

        })
    })


    conn.on('binary', function (inStream) {
        // Empty buffer for collecting binary data
        var data = new Buffer(0)
        // Read chunks of binary data and add to the buffer
        inStream.on('readable', function () {
            var newData = inStream.read()
            if (newData)
                data = Buffer.concat([data, newData], data.length + newData.length)
        })
        inStream.on('end', function () {
            console.log("Received " + data.length + " bytes of binary data")
            writeFile('henk.jpg', data)
            // process_my_data(data)
        })
    })

    function writeFile(filename, data) {

        console.log('dirname', __dirname)

        // The absolute path of the new file with its name
        var filepath = 'transfers/' + filename

        fs.writeFile(filepath, data, (err) => {
            if (err) throw err;

            console.log("The file was succesfully saved!");
        });

    }

    // @todo actie ondernemen wanneer er
    // geen pong terugkomt omdat de user te beroerde latency heeft
    // of disconnected is.
    // - Notify andere users,
    // - Disconnect,
    // - verwijder user uit userList
    conn.on('pong', function (e) {
        console.log('*** pong ***')
    })


    conn.on('close', function (code, reason) {
        var reason = reason
        switch (code) {
            case 1000:
                reason = 'Normal Closure'
                break
            case 1001:
                reason = '"Going Away" User navigated away'
                break

        }
        console.log('Connection closed', code, reason, this.key);

        message = createMessage(conn.key, 'disconnect', {})

        userList.removeUser(conn.key)

        server.connections.forEach(function (eachConn) {
            eachConn.sendText(message, function (e) {
                // console.log(e)
            })
        })

    })

    conn.on('error', function (errorObj) {

        switch (errorObj.errno) { //code
            case 'ECONNRESET':
                console.log('Someone has left the building (ECONNRESET)')
                console.log('Error', errorObj)
                break
            default:
                console.log('Error', errorObj)
                break
        }
    })
}


function createMessage(sender, type, content) {
    return JSON.stringify({'sender': sender, 'type': type, 'data': content, 'date': new Date()})
}