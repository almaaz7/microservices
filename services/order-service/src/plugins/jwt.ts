import fp from "fastify-plugin"
import fastifyJwt from "@fastify/jwt"
import type { FastifyInstance } from "fastify"

export const registerJwt = fp(async (fastify: FastifyInstance) => {
    fastify.register( fastifyJwt, {secret: fastify.config.JWT_SECRET})
})