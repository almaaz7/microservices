import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export const registerAuthenticate = fp( async (fastify: FastifyInstance) => {
    fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
        try{
            await request.jwtVerify();
        }catch(err){
            return reply.status(401).send({error: "Unauthorized"})
        }
    })
})