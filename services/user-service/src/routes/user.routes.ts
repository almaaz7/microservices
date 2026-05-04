import fastify, { FastifyInstance } from "fastify";
import { getUserById, registerUser } from "../handlers/user.handler.js";

const registerUserSchema = {
    body: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email'}
        },
        additionalProperties: false
    }
}

const getUserSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                type: 'string', minLength: 1
            }
        }
    }
}

export const userRoutes = async (fastify: FastifyInstance) => {
    fastify.get("/users/:id", {
        preHandler: [fastify.authenticate],
        schema: getUserSchema,
        handler: getUserById,
    })
    fastify.post('/users', { schema: registerUserSchema}, registerUser)
}