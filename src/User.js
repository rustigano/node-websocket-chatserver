module.exports = class User {
    constructor(id, username) {
        this.id = id
        this.username = username
        this.avatar = undefined
        this.x = 0
        this.y = 0
    }
    getObjectLiteral (u) {
        return {
            'id': this.id,
            'username': this.username,
            'x': this.x,
            'y': this.y,
            'avatar': this.avatar
        }
    }
}
// module.exports = User