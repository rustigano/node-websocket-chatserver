const url = require('url')
const events = require('events')
const fs = require('fs')
const ws = require('nodejs-websocket')

const UserController = require('./UserController')
const RoomController = require('./RoomController')

var server = ws.createServer(socketConnection).listen(3001)

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

var userController = new UserController()
var roomController = new RoomController()

roomController.on('userTransferredEvent', function (userId, sourceRoomId, destinationRoomId) {
    console.log('user has been transferred', userId, sourceRoomId, destinationRoomId)

    // notify users in sourceRoom that the user has left the room
    let leaveMsg = createMessage(userId, 'leaves-room', {})
    sendMessageToClientsInRoom(leaveMsg, sourceRoomId)

    // notify users in destinationRoom (including the transferred user) that the user joined the room
    let user = userController.findUser(userId)
    let destinationRoom = roomController.getRoomById(destinationRoomId)
    let roomUsers = userController.getUsersById(destinationRoom.users)
    let enterMsg = createMessage(userId, 'enters-room', {'user': user, 'roomId': destinationRoomId, 'users': roomUsers})
    sendMessageToClientsInRoom(enterMsg, destinationRoomId)
})

function sendMessageToAllClients(msgString) {
    server.connections.forEach(function (eachConn) {
        eachConn.sendText(msgString)
    })
}
function sendMessageToAListOfClients(msgString, ids) {
    if (!Array.isArray(ids)) {
        throw new Error('ids should be an array')
    }
    ids.forEach((id) => {
        let targetConn = server.connections.find(conn => conn.key === id)
        if (targetConn !== undefined) targetConn.sendText(msgString)
    })
}
function sendMessageToClientsInRoom(msgString, roomId) {
    // console.log('msgString', msgString)
    let room = roomController.getRoomById(roomId)
    sendMessageToAListOfClients(msgString, room.users)
}
function sendMessageToClient(msgString, clientId) {
    let targetConn = server.connections.find(conn => conn.key === clientId)
    if (targetConn !== undefined) targetConn.sendText(msgString)
}


// username is passed in
// the connection URL: ws://localhost:3001/?username=henkie
function getUsernameFromURL(conn) {
    var urlObj = url.parse(conn.path, true)
    var username = urlObj.query.username
    return username
}

function socketConnection(conn) {

    // New user, parse the username from the connection URL:
    var username = getUsernameFromURL(conn)

    // Add the new user to the userlist
    userController.addUser(conn.key, username)
    // Add the user to the main room:
    roomController.addUser(conn.key, 1)

    console.log(`*** ${username} connected, key: ${conn.key}`)

    var mainRoom = roomController.getRoomById(1)
    var mainRoomUsers = userController.getUsersById(mainRoom.users)

    var message = createMessage('', 'connect', {
        'key': conn.key,
        'users': mainRoomUsers,
        'rooms': roomController.rooms,
        'room': mainRoom
    })

    // Send the users' 'key' and the userlist back to the client.
    // When that is done, notify the other connected
    // users about the newly connected user.

    conn.sendText(message, function (e) {

        // notify other connected clients in the main room about the newly connected user:
        var notificationMsg = createMessage(conn.key, 'new-user', {'username': username})
        sendMessageToClientsInRoom(notificationMsg, 1)

    })

    conn.on('text', function (msg) {

        // console.log('Received: ', msg);

        var messageObject = JSON.parse(msg)
        // var isWhispering = false
        // var passMessageToOtherClients = true
        messageObject.sender = conn.key
        const roomId = roomController.findCurrentRoom(conn.key)

        switch (messageObject.type) {
            case 'set-avatar':
                userController.changeProp(conn.key, 'avatar', messageObject.data.image)
                sendMessageToClientsInRoom(JSON.stringify(messageObject), roomId)
                break
            case 'set-username':
                userController.changeProp(conn.key, 'username', messageObject.data.username)
                console.log(`set-username: ${messageObject.data.username}`)
                break

            case 'pos':
                userController.changeProp(conn.key, 'x', messageObject.data.x)
                userController.changeProp(conn.key, 'y', messageObject.data.y)
                sendMessageToClientsInRoom(JSON.stringify(messageObject), roomId)
                // console.log(`set-pos: ${messageObject.data.x}, ${messageObject.data.y}`)
                break

            case 'msg':
                if (messageObject.data.whisperTo === undefined) {
                    // sendMessageToAllClients(messageObject)
                    sendMessageToClientsInRoom(JSON.stringify(messageObject), roomId)
                } else {
                    // send the whispered message only to the target user and the sender of the message
                    sendMessageToAListOfClients( JSON.stringify(messageObject), [messageObject.data.whisperTo, conn.key])
                }
                break

            case 'create-room':
                let newRoomId = roomController.createRoom(conn.key, messageObject.data.name)
                // roomController.changeProp(newRoomId, 'backgroundColor', 'purple')
                // console.log('roomid', newRoomId)
                let newRoom = roomController.getRoomById(newRoomId)
                messageObject.data['room'] = newRoom
                // console.log('newRoom', newRoom)
                sendMessageToAllClients(JSON.stringify(messageObject))
                break

            case 'move-to-room':
                // roomController fires event on successful transfer
                roomController.moveToRoom(conn.key, messageObject.data.id)
                break

            case 'client-ping':
                conn.sendText(createMessage(conn.key, 'server-pong', {}))
                break

            default:
                break
        }

    })

    /**
     * @todo implement client server transfer agreement/handshake
     * and send not only the filecontents but also the filename
     * for now every file will be written to henk.jpg
     * this file will be overwritten everytime a new file is received
     */
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
            console.log(`Received ${data.length} bytes of binary data`)
            writeFile('henk.jpg', data)
            // process_my_data(data)
        })
    })

    function writeFile(filename, data) {

        console.log(`dirname: ${__dirname}`)

        // The absolute path of the new file with its name
        var filepath = 'transfers/' + filename

        fs.writeFile(filepath, data, (err) => {
            if (err) throw err;
            console.log('The file was succesfully saved!')
        });

    }

    /**
     * @todo actie ondernemen wanneer er
     * geen pong terugkomt omdat de user te beroerde latency heeft
     * of disconnected is.
     * - Notify andere users,
     * - Disconnect,
     * - verwijder user uit userController
     */
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
        console.log(`Connection closed. Code: ${code} reason:${reason} key: ${this.key}`)

        message = createMessage(conn.key, 'disconnect', {})

        userController.removeUser(conn.key)
        roomController.removeUserEverywhere(conn.key)

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
    return JSON.stringify({'sender': sender, 'type': type, 'data': content})
}