import fastifyEnv from '@fastify/env'
import fp from 'fastify-plugin'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

const schema = {
  type: 'object',
  required: ['PORT', 'HOST', 'DATABASE_URL', 'JWT_SECRET'],
  properties: {
    PORT: { type: 'integer' },
    HOST: { type: 'string' },
    DATABASE_URL: { type: "string"},
    JWT_SECRET: { type: "string"},
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number
      HOST: string
      JWT_SECRET: string
      DATABASE_URL: string
    },
    authenticate: (request: FastifyRequest, reply: FastifyReply )=> Promise<void>
  }
}

export const registerConfig = fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyEnv, { schema, dotenv: true })
})
