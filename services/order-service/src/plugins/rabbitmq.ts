import fp from "fastify-plugin"
import amqp, { type Channel, type ChannelModel } from "amqplib"
import type { FastifyInstance } from "fastify"

export const registerRabbitMQ = fp( async( fastify: FastifyInstance) => {
    const connection: ChannelModel = await amqp.connect(fastify.config.RABBITMQ_URL);
    const channel: Channel = await connection.createChannel();

    // Declare the exhange (idempotent - safe to call every startup)
    await channel.assertExchange("orders", "topic", {durable: true});

    fastify.decorate("amqp", { connection, channel });

    //  clean close the server
    fastify.addHook("onClose", async () => {
        await channel.close();
        await connection.close();
    })
})