import { FastifyInstance } from 'fastify';
import { createProduct, getProductById } from '../handlers/product.handlers.js';

const getProductSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', minLength: 1 }
        }
    }
}

const createProductSchema = {
    body: {
        type: 'object',
        required: ['name', 'price', 'stock'],
        properties: {
            name: { type: 'string', minLength: 2},
            price: { type: 'number', minimum: 1 },
            stock: { type: 'number', minimum: 0 }
        }
    }
}

export const productRoutes = async (fastify: FastifyInstance) => {
    fastify.get('/products/:id', { schema: getProductSchema }, getProductById),
    fastify.post('/products', { preHandler: [fastify.authenticate], schema: createProductSchema, handler: createProduct })
}