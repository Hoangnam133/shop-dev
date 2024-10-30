const StatusCode = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    CONFLICT: 409,
    GONE: 410,
    LENGTH_REQUIRED: 411,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    URI_TOO_LONG: 414,
    UNSUPPORTED_MEDIA_TYPE: 415,
    EXPECTATION_FAILED: 417,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    HTTP_VERSION_NOT_SUPPORTED: 505
};

const ReasonStatusCode = {
    OK: 'Request successful',
    CREATED: 'Resource created successfully',
    ACCEPTED: 'Request accepted but not yet processed',
    NO_CONTENT: 'Request successful but no content to return',
    MOVED_PERMANENTLY: 'Resource permanently moved to a new URL',
    FOUND: 'Resource temporarily moved to a different URL',
    SEE_OTHER: 'Redirect to a different URL',
    NOT_MODIFIED: 'Resource has not been modified since last request',
    BAD_REQUEST: 'Invalid request format or parameters',
    UNAUTHORIZED: 'Authentication required or invalid credentials',
    FORBIDDEN: 'Access denied due to insufficient permissions',
    NOT_FOUND: 'Resource not found',
    METHOD_NOT_ALLOWED: 'HTTP method not allowed for this resource',
    NOT_ACCEPTABLE: 'Requested resource format not acceptable',
    CONFLICT: 'Request conflicts with the current state of the resource',
    GONE: 'Resource no longer available',
    LENGTH_REQUIRED: 'Content-Length header is missing',
    PRECONDITION_FAILED: 'Precondition for the request failed',
    PAYLOAD_TOO_LARGE: 'Request payload too large',
    URI_TOO_LONG: 'Request URI too long',
    UNSUPPORTED_MEDIA_TYPE: 'Media type of the request is not supported',
    EXPECTATION_FAILED: 'Expectation given in the request headers could not be met',
    INTERNAL_SERVER_ERROR: 'An unexpected error occurred on the server',
    NOT_IMPLEMENTED: 'Server does not support the functionality required to fulfill the request',
    BAD_GATEWAY: 'Invalid response from upstream server',
    SERVICE_UNAVAILABLE: 'Server currently unable to handle the request',
    GATEWAY_TIMEOUT: 'Upstream server failed to respond in time',
    HTTP_VERSION_NOT_SUPPORTED: 'HTTP protocol version not supported'
};

class ErrorResponse extends Error{
    constructor(message, status){
        super(message)
        this.status = status
    }
}
class BadRequestError extends ErrorResponse{
    constructor(message = ReasonStatusCode.FORBIDDEN, statusCode = StatusCode.FORBIDDEN){
        super(message, statusCode)
    }
}

class ConflictRequestError extends ErrorResponse{
    constructor(message = ReasonStatusCode.CONFLICT, statusCode = StatusCode.CONFLICT){
        super(message, statusCode)
    }
}
class Unauthorized extends ErrorResponse{
    constructor(message = ReasonStatusCode.UNAUTHORIZED, statusCode = StatusCode.UNAUTHORIZED){
        super(message, statusCode)
    }
}
class NotFoundError extends ErrorResponse{
    constructor(message = ReasonStatusCode.NOT_FOUND, statusCode = StatusCode.NOT_FOUND){
        super(message, statusCode)
    }
}
class ForbiddenError extends ErrorResponse{
    constructor(message = ReasonStatusCode.FORBIDDEN, statusCode = StatusCode.FORBIDDEN){
        super(message, statusCode)
    }
}
module.exports = {
    BadRequestError,
    ConflictRequestError,
    Unauthorized,
    NotFoundError,
    ForbiddenError
}