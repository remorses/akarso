export class KnownError extends Error {
    constructor(message: string, opts?: ErrorOptions) {
        super(message, opts)
        this.name = 'KnownError'
    }
}
export class AppError extends Error {
    constructor(message: string, opts?: ErrorOptions) {
        super(message, opts)
        this.name = 'AppError'
    }
}
