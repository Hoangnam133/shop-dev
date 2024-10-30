const StatusCode = {
    OK: 200,
    CREATE: 201
}

const ReasonStatusCode = {
    CREATE: 'Create!',
    OK: 'Success'
}

class SuccessResponse {
    constructor({message, statusCode = StatusCode.OK, reasonStatusCode = ReasonStatusCode.OK, metaData = {}}){
        this.message = !message ? reasonStatusCode : message
        this.status = statusCode
        this.metaData = metaData
    }
    send(res, headers = {}){
        return res.status(this.status).json(this)
    }
}

class CREATE extends SuccessResponse {
    constructor(message, statusCode = StatusCode.CREATE, reasonStatusCode = ReasonStatusCode.CREATE, metaData){
        super({message, statusCode, reasonStatusCode, metaData})
    }
}
class OK extends SuccessResponse {
    constructor(message, metaData){
        super({message, metaData})
    }
}

module.exports = {
    OK,
    CREATE,
    SuccessResponse
}