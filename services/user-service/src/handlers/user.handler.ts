import { FastifyRequest, FastifyReply } from "fastify";
import { AppError, User } from "@microservices/shared";
import { prisma } from "../lib/prisma.js";

export const registerUser = async (
    request: FastifyRequest<{Body: {name: string; email: string}}>,
    reply: FastifyReply
) => {
    const { name, email } = request.body

    const user = await prisma.user.create({
        data: {name, email}
    })

    return reply.status(201).send(user);
}

export const getUserById = async (
    request: FastifyRequest<{Params: {id: string}}>,
    reply: FastifyReply
) => {
    const id = request.params.id

    const user = await prisma.user.findUnique({
        where: { id }
    })

    if(!user) {
        throw new AppError('User not fount', 404)
    }

    return reply.status(200).send(user);
}