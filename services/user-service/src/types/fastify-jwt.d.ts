import "@fastify/jwt";
import "fastify"
import type { FastifyRequest, FastifyReply } from "fastify";

declare module "@fastify/jwt" {
    interface FastifyJwt {
        payload: { id: string; email: string};
        user: { id: string; email: string};
    }
}

declare module "fastify" {
    interface FastifyInstance {
        authenticate: ( request: FastifyRequest, reply: FastifyReply) => Promise<void>
    }
}