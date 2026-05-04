import fastifyEnv from '@fastify/env'
import fp from 'fastify-plugin'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { Channel, ChannelModel } from 'amqplib'

const schema = {
  type: 'object',
  required: ['PORT', 'HOST', 'USER_SERVICE_URL', 'PRODUCT_SERVICE_URL', 'JWT_SECRET', 'RABBITMQ_URL'],
  properties: {
    PORT: { type: 'integer' },
    HOST: { type: 'string' },
    USER_SERVICE_URL: { type: 'string' },
    PRODUCT_SERVICE_URL: { type: 'string' },
    JWT_SECRET: { type: 'string'},
    RABBITMQ_URL: {type: 'string'}
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number
      HOST: string
      USER_SERVICE_URL: string
      PRODUCT_SERVICE_URL: string
      JWT_SECRET: string
      RABBITMQ_URL: string
    }
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    amqp: { connection: ChannelModel; channel: Channel }
  }
}

export const registerConfig = fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyEnv, { schema, dotenv: true })
})
