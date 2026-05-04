import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { Order } from '@microservices/shared';
import { User } from '@microservices/shared';
import { Product } from '@microservices/shared';
import { prisma } from '../lib/prisma.js';

export const createOrderHandlers = (fastify: FastifyInstance) => {
    const createOrder = async (
        request: FastifyRequest<{ Body: { userId: string, productId: string } }>,
        reply: FastifyReply
    ) => {
        const { userId, productId } = request.body
        const authHeader = request.headers.authorization;

        const userResponse = await fetch(`${fastify.config.USER_SERVICE_URL}/users/${userId}`,
            { headers: authHeader ? { Authorization: authHeader } : {} }
        )

        if (!userResponse.ok) {
            return reply.status(404).send({ message: "User not found" });
        }

        const productResponse = await fetch(`${fastify.config.PRODUCT_SERVICE_URL}/products/${productId}`)

        if (!productResponse.ok) {
            return reply.status(404).send({ message: "Product not found" });
        }

        const user = await userResponse.json() as User
        const product = await productResponse.json() as Product

        const order = await prisma.order.create({
            data: {
                userId,
                productId,
                userName: user.name,
                productName: product.name,
                price: product.price,
                status: 'success'
            }
        })

        const event = {
            orderId: order.id,
            userId: order.userId,
            productId: order.productId,
            userName: order.userName,
            productName: order.productName,
            price: order.price,
            createdAt: new Date().toISOString(),
        };

        fastify.amqp.channel.publish(
            "orders",
            "order.created",
            Buffer.from(JSON.stringify(event)),
            { persistent: true}
        )

        return reply.status(201).send(order)
    }


    const getOrderById = async (
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) => {
        const id = request.params.id

        const order = await prisma.order.findUnique({
            where: { id }
        })

        if (!order) {
            return reply.status(404).send("Order not found")
        }

        return reply.status(200).send(order)
    }

    return { createOrder, getOrderById }

}