import { FastifyInstance } from "fastify";
import { createOrderHandlers } from "../handlers/order.handlers.js";

const createOrderSchema = {
    body: {
        type: 'object',
        required: ['userId', 'productId'],
        properties: {
            userId: {
                type: 'string', minLength: 1
            },
            productId: {
                type: 'string', minLength: 1
            }
        },
        additionalProperties: false
    }
}

const getOrderSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                type: 'string',
                minLength: 1
            }
        }
    }
}

export const orderRoute = async (fastify: FastifyInstance) => {

    const { createOrder, getOrderById } = createOrderHandlers(fastify)

    fastify.get('/orders/:id',{ schema: getOrderSchema }, getOrderById)
    fastify.post('/orders',{ preHandler: [fastify.authenticate] ,schema: createOrderSchema, handler: createOrder })
}