/**
 * @type {module.Room}
 *
 * maybe: size of the room (bigger than screen)
 * this.backgroundImage
 *
 * public private password
 *
 * things (props):
 * - plaatje (img) hier (x,y)
 * - plaatje (img) daar (x,y)
 * - plaatje (img) zus (x,y)
 * - plaatje (img) zo (x,y)
 * 
 *
 */
module.exports = class Room {
    constructor(id, creatorId, roomName, backgroundColor) {
        this.id = id
        this.creatorId = creatorId
        this.name = roomName
        this.backgroundColor = backgroundColor
        this.users = []
    }
/*    getRandomColor () {
        var letters = '0123456789ABCDEF'
        var color = '#'
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)]
        }
        return color
    }  */
}
