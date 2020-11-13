class Response {
    constructor(options){
        this.code = options.code
        this.msg = options.msg
        this.data = options.data
    }
}
module.exports = Response