const Room = require('./Room')
const events = require('events');

module.exports = class RoomController extends events.EventEmitter {

    constructor() {
        super()
        this.rooms = []
        this.lastIndex = 0 // Unique id for rooms
        this.createRoom('--system--', 'Welcome hall')
    }

    createRoom(userId, roomname) {
        this.lastIndex++
        this.rooms.push(new Room(this.lastIndex, userId, roomname))
        // console.log(`Room created by user: ${userId} with the name: ${roomname}`)
        return this.lastIndex
    }

    transferUser(userId, sourceRoomId, destinationRoomId) {
        if (sourceRoomId === destinationRoomId) return false
        if (this.getRoomById(destinationRoomId) === undefined) return false
        if (!this.removeUser(userId, sourceRoomId)) return false
        if (!this.addUser(userId, destinationRoomId)) {
            // Could not add user to the destination room, add back to the source room
            if (!this.addUser(userId, sourceRoomId)) {
                console.error('*** User could not be added to the destination room and not back in the source room, user is now in limbo!!!')
            }
            return false
        }
        this.emit('userTransferredEvent', userId, sourceRoomId, destinationRoomId)
        return true
    }

    moveToRoom(userId, destinationRoomId) {
        var currentRoomId = this.findCurrentRoom(userId)
        return this.transferUser(userId, currentRoomId, destinationRoomId)
    }

    addUser(userId, roomId) {
        var currentRoomId = this.findCurrentRoom(userId)
        if (currentRoomId === -1) {
            var room = this.getRoomById(roomId)
            if (room === undefined) {
                console.error('Room not found, cannot add the user to this room')
            } else {
                room.users.push(userId)
                // console.log('User added to room')
                return true
            }
        } else {
            console.error('Cannot add the user to a room. User is already present in another room')
        }
        return false
    }

    removeUser(userId, roomId) {

        var room = this.getRoomById(roomId)
        if (room === undefined) {
            console.error('Room not found, cannot remove the user from the room')
        } else {
            var userIndex = room.users.findIndex(uid => uid === userId)
            if (userIndex === -1) {
                console.error('User not found in room, cannot remove the user from the room')
                console.error('The users in the room are', room.users)
            } else {
                room.users.splice(userIndex, 1)
                return true
            }
        }
        return false
    }

    removeUserEverywhere(userId) {
        var i = this.rooms.length
        while (i--) {
            let userIndex = this.rooms[i].users.indexOf(userId)
            if (userIndex !== -1) this.rooms[i].users.splice(userIndex, 1)
        }
    }

    findCurrentRoom(userId) {
        var i = this.rooms.length
        while (i--) {
            if (this.rooms[i].users.indexOf(userId) !== -1) return this.rooms[i].id
        }
        return -1
    }

    deleteRoom(id) {
        if (id === 1) {
            // console.error(`Cannot delete the main room`)
            return false
        }

        const room = this.getRoomById(id)
        if (room === undefined) return false
        // If there are users in this room, move them to the main room
        room.users.forEach(userId => this.transferUser(userId, id, 1))

        let index = this.getRoomIndex(id)
        this.rooms.splice(index, 1)
        // console.log(`Room removed, number of rooms left: ${this.rooms.length}`)

        return true

    }

    getRoomById(id) {
        return this.rooms.find(r => r.id === id)
    }

    getRoomIndex(id) {
        return this.rooms.findIndex(r => r.id === id)
    }

    roomExists(id) {
        return this.getRoomIndex(id) !== -1
    }

    changeProp(id, prop, value) {
        var r = this.getRoomById(id)
        if (r) r[prop] = value
    }

    filterByUser(userId) {
        return this.rooms.filter(room => room.creatorid === userId ? true : false)
    }

}
