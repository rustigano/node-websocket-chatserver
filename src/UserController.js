var User = require('./User')

module.exports = class UserController {

    constructor() {
        this.users = []
    }

    addUser(id, username) {
        if (this.userExists(id)) {
            console.log(`user: ${username} met id: '${id}' bestond al`)
        } else {
            this.users.push(new User(id, username))
            // console.log(`user: ${username} added, total number of users: ${this.users.length}`)
        }
    }

    removeUser(id) {
        const index = this.findUserIndex(id)
        if (index !== -1) this.users.splice(index, 1)
        // console.log(`user removed, number of users: ${this.users.length}`)
    }

    findUser(id) {
        return this.users.find(u => u.id === id)
    }

    findUserIndex(id) {
        return this.users.findIndex(u => u.id === id)
    }

    userExists(id) {
        return (this.findUserIndex(id) !== -1)
    }

    /**
     * @param ids array
     */
    getUsersById(ids) {
        var users = []
        ids.forEach(userId => users.push(this.findUser(userId)))
        return users
    }

    changeProp(id, prop, value) {
        var u = this.findUser(id)
        if (u) u[prop] = value
    }

}
