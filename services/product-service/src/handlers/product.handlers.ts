import { FastifyRequest, FastifyReply } from "fastify";
import { Product } from "@microservices/shared";
import { prisma } from "../lib/prisma.js";

export const getProductById = async (
    request: FastifyRequest<{Params: {id: string}}>,
    reply: FastifyReply
) => {
    const id = request.params.id

    const product = await prisma.product.findUnique({
        where: {id}
    })

    if(!product){
        reply.status(404).send("Product not found.")
    }

    reply.status(200).send(product)
}

export const createProduct = async (
    request: FastifyRequest<{Body: {name: string, price: number, stock: number}}>,
    reply: FastifyReply
) => {
    const { name, price, stock } = request.body

    const product = await prisma.product.create({
        data: {name, price, stock}
    })

    reply.status(201).send(product)
}