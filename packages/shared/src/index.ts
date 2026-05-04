export interface User{
    id: string,
    name: string,
    email: string
}

export interface Product {
    id: string,
    name: string,
    price: number,
    stock: number
}

export interface Order{
    id: string,
    userId: string,
    productId: string,
    userName: string,
    productName: string,
    price: number,
    status: string,
}

export class AppError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
        this.name = 'AppError'
    }
}