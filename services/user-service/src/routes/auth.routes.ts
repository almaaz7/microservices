import type { FastifyInstance } from "fastify";
import { createAuthHandlers } from "../handlers/auth.handlers.js";

export const authRoutes = async ( fastify: FastifyInstance ) => {
    const { register, login } = createAuthHandlers(fastify);

    fastify.post("/register", {
        schema: {
            body: {
                type: "object",
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: "string", minLength: 1},
                    email: { type: "string", format: "email"},
                    password: { type: "string", minLength: 6},
                }
            }
        },
        handler: register,
    })

    fastify.post("/login", {
        schema: {
            body: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email"},
                    password: { type: "string", minLength: 1},
                }
            }
        },
        handler: login,
    })
}