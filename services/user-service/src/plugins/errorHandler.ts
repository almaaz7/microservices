import { FastifyInstance, FastifyError } from 'fastify'
import fp from 'fastify-plugin'
import { AppError } from '@microservices/shared'

export const errorHandler = fp(async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((error: FastifyError | AppError, request, reply ) => {
        fastify.log.error(error)

        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                statusCode: error.statusCode,
                error: error.name,
                message: error.message
            })
        }

        if (error.statusCode === 400) {
            return reply.status(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: error.message
            })
        }

        return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Something went wrong'
        })
    })
})