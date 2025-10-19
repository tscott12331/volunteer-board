// return on api success
export function APISuccess(data) {
    return {
        success: true,
        data,
    }
}

// return on api error
export function APIError(message) {
    return {
        success: false,
        error: message,
    }
}
