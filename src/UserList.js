var User = require('./User')

module.exports = class UserList {
    // ..and an (optional) custom class constructor. If one is
    // not supplied, a default constructor is used instead:
    // constructor() { }
    constructor() {
        this.users = []
    }


    // Simple class instance methods using short-hand method
    // declaration
    addUser(id, username) {
        if (this.findUser(id) === undefined) {
            var u = new User(id, username)
            this.users.push(u)
            console.log('user added, number of users', this.users.length)
        } else {
            console.log('user bestond al',id, username)
        }
    }
    removeUser(id) {
        var u = this.findUser(id)
        const index = this.users.indexOf(u);
        if (index !== -1) this.users.splice(index, 1)
        console.log('user removed, number of users', this.users.length)
    }
    findUser(id) {
        return this.users.find(function (u) { return u.id == id });
    }
    userChange(id, prop, value) {
        var u = this.findUser(id)
        if (u)  u[prop] = value
    }
/*    getObjectLiteral (u) {
        return {'id':u.id, 'username':u.username, 'x': u.x, 'y': u.y, 'avatar': u.avatar}
    }*/
    flattenUserList() {
        let n = this.users.length
        var arr = []
        while(n--) {
            let ol = this.users[n].getObjectLiteral()
            arr.push(ol)
        }
        return arr
    }

}
// module.exports = UserList