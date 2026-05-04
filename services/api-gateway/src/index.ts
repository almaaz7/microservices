import Fastify from 'fastify';
import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';
import httpProxy from '@fastify/http-proxy';

const server = Fastify({ logger: true })

const schema = {
    type: 'object',
    required: ['PORT', 'HOST', 'USER_SERVICE_URL', 'PRODUCT_SERVICE_URL', 'ORDER_SERVICE_URL'],
    properties: {
        PORT: { type: 'integer' },
        HOST: { type: 'string' },
        USER_SERVICE_URL: { type: 'string' },
        PRODUCT_SERVICE_URL: { type: 'string' },
        ORDER_SERVICE_URL: { type: 'string' }
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            PORT: number
            HOST: string
            USER_SERVICE_URL: string
            PRODUCT_SERVICE_URL: string
            ORDER_SERVICE_URL: string
        }
    }
}

await server.register(fp(async (f) => {
    await f.register(fastifyEnv, {schema, dotenv: true})
}))

server.register(httpProxy, {
    upstream: server.config.USER_SERVICE_URL,
    prefix: '/users'
})

server.register(httpProxy, {
    upstream: server.config.PRODUCT_SERVICE_URL,
    prefix: '/products'
})

server.register(httpProxy, {
    upstream: server.config.ORDER_SERVICE_URL,
    prefix: '/orders'
})

server.get('/health', async () => {
    return {
        status: 'ok',
        service: 'api-gateway'
    }
})

const start = async () => {
    try{
        await server.listen({
            port: server.config.PORT,
            host: server.config.HOST
        })
    }catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start();