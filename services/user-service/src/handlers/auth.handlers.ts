import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt"
import { prisma } from "../lib/prisma.js";
import { AppError } from "@microservices/shared";

interface RegisterBody {
    name: string;
    email: string;
    password: string;
}

interface LoginBody {
    email: string;
    password: string;
}

export const createAuthHandlers = ( fastify: FastifyInstance ) => {
    const register = async (
        request: FastifyRequest<{ Body: RegisterBody }>,
        reply: FastifyReply
    ) => {
        const { name, email, password } = request.body;

        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if(existing){
            throw new AppError("Email Already Register", 409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        return reply.status(201).send({
            id: user.id,
            name: user.name,
            email: user.email
        })
    };

    const login = async (
        request: FastifyRequest<{ Body: LoginBody }>,
        reply: FastifyReply
    ) => {
        const { email, password } = request.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if(!user || !user.password){
            throw new AppError("Invalid credential", 401);
        }

        const isValid = await bcrypt.compare(password, user.password);
        if(!isValid){
            throw new AppError("Invalid Credentials", 401)
        }

        const token = await reply.jwtSign(
            { id: user.id, email: user.email },
            { expiresIn: "1h"}
        )

        return reply.send({ token });
    }

    return { register, login };
}