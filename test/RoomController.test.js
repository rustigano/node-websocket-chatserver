var expect = require("chai").expect;
var RoomController = require("../src/RoomController")
var UserController = require("../src/UserController")

describe('Room controller', function () {

    var roomController


    describe('Initial state', function () {

        beforeEach(function () {
            roomController = new RoomController()
        })

        describe('The main room', function () {
            it('Has been created', function () {
                expect(roomController.rooms.length).to.equal(1)
            })
            it(`Has id: '1'`, function () {
                let mainRoom = roomController.getRoomById(1)
                expect(mainRoom).to.not.equal(undefined)
            })
            it(`Is named 'Welcome  hall'`, function () {
                let mainRoom = roomController.getRoomById(1)
                expect(mainRoom.name).to.equal('Welcome hall')
            })
        })

    })

    describe('Creating a room', function () {

        before(function () {
            roomController = new RoomController()
        })

        it('Returns the id of the new room', function () {
            let roomId = roomController.createRoom('my-user-id', 'The teachers room')
            // first room (Welcome hall) has id 1,
            // so the new room should have id 2:
            expect(roomId).to.equal(2)
        })
        it('Adds the new room to the rooms-list', function () {
            expect(roomController.rooms.length).to.equal(2)
        })
    })

    describe('New user has connected', function () {

        before(function () {
            roomController = new RoomController()
        })

        it('Adds the user to the main room', function () {
            const userController = new UserController()
            userController.addUser('hermans-user-id', 'Herman')
            expect(userController.users.length).to.equal(1)
            let u = userController.findUser('hermans-user-id')
            expect(u.username).to.equal('Herman')
            // Add Herman to the main-room:
            roomController.addUser('hermans-user-id', 1)
            // find the main room:
            let mainRoom = roomController.getRoomById(1)
            // does it have 1 user?
            expect(mainRoom.users.length).to.equal(1)
        })
    })

    describe('Teleporting users', function () {

        var userController

        before(function () {
            roomController = new RoomController()
            userController = new UserController()
            userController.addUser('hermans-user-id', 'Herman')
            roomController.addUser('hermans-user-id', 1)
        })
        describe('findCurrentRoom', function () {
            it('Returns the roomId when user is found in a room', function () {
                let roomId = roomController.findCurrentRoom('hermans-user-id')
                // Herman is in the main room that has the id '1'
                expect(roomId).to.equal(1)
            })
            it('Returns -1 when the user is not found in any room', function () {
                // truus-user-id does not exist
                let roomId = roomController.findCurrentRoom('truus-user-id')
                expect(roomId).to.equal(-1)
            })
        })
        describe('User changes from room', function () {

            it('Cannot move to a non-existent room', function () {
                // Destination room 5 doesn't exist:
                roomController.transferUser('hermans-user-id', 1, 5)
                // User should still be in room 1
                let userIsInRoomId = roomController.findCurrentRoom('hermans-user-id')
                expect(userIsInRoomId).to.equal(1)
            })
            it('Removes the user from the source room', function () {
                let roomIndex = roomController.createRoom('hermans-user-id', 'Hermans cosy camping site')
                // Now there should be 2 rooms:
                expect(roomController.rooms.length).to.equal(2)
                // Move Herman from the main room to the new room:
                roomController.transferUser('hermans-user-id', 1, roomIndex)
                // Herman is removed from the main room,
                // now there are no users in the main room
                let mainRoom = roomController.getRoomById(1)
                expect(mainRoom.users).to.be.an('array').that.is.empty
            })
            it('Adds the user to the destination room', function () {
                let userIsInRoomId = roomController.findCurrentRoom('hermans-user-id')
                // User is not in the main room:
                expect(userIsInRoomId).to.not.equal(1)
                // But in the room it just created:
                let newRoom = roomController.getRoomById(userIsInRoomId)
                expect(newRoom.name).to.be.a('string').that.equals('Hermans cosy camping site')
            })
        })
    })

    describe('Removing a room', function () {
        beforeEach(function () {
            roomController = new RoomController()
        })

        it('Cannot delete the main room', function () {
            roomController.deleteRoom(1)
            // The number of rooms should still be the same (1):
            expect(roomController.rooms.length).to.equal(1)
        })
        it('Returns false when attempting to delete the main room', function () {
            let success = roomController.deleteRoom(1)
            expect(success).to.be.false
        })
        it('Deletes the room from the rooms-list by a given id', function () {
            let roomId = roomController.createRoom('my-user-id', 'The teachers room')
            // There should be 2 rooms now:
            expect(roomController.rooms.length).to.equal(2)
            roomController.deleteRoom(roomId)
            // The room has been deleted, there should be 1 room less now:
            expect(roomController.rooms.length).to.equal(1)
        })
        it('Returns false when room with given id does not exist', function () {
            let nonExistentRoomId = 10000
            let success = roomController.deleteRoom(nonExistentRoomId)
            expect(success).to.be.false
        })
        it('Moves all users present in the room to the main room', function () {
            // create a room:
            let teachersRoomId = roomController.createRoom('my-user-id', 'The teachers room')
            const userController = new UserController()
            userController.addUser('hermans-user-id', 'Herman')
            roomController.addUser('hermans-user-id', teachersRoomId)
            // Now herman is in The teachers room
            let hermanIsFoundInRoomId = roomController.findCurrentRoom('hermans-user-id')
            expect(hermanIsFoundInRoomId).to.equal(teachersRoomId)
            roomController.deleteRoom(teachersRoomId)
            // The room is deleted, it should no longer exist
            let roomExists = roomController.roomExists(teachersRoomId)
            expect(roomExists).to.be.false

            // Herman should be moved to the main room (with id 1)
            hermanIsFoundInRoomId = roomController.findCurrentRoom('hermans-user-id')
            expect(hermanIsFoundInRoomId).to.equal(1)
        })
    })


    describe('List rooms by userid', function () {
        before(function () {
            roomController = new RoomController()
        })
        it('return a list of rooms that the user created', function () {
            roomController.createRoom('my-user-id', 'The teachers room')
            roomController.createRoom('some-other-user-id', 'The playground')
            roomController.createRoom('my-user-id', 'The concerthall')
            // There should be 4 rooms now (the main hall and 3 new ones):
            expect(roomController.rooms.length).to.equal(4)
            let userRooms = roomController.filterByUser('my-user-id')
            // The user created 2 rooms, so there should be 2 returned:
            expect(userRooms.length).to.equal(2)
        })
    })
})