import "dotenv/config"
import amqp from "amqplib"

const RABBITMQ_URL = process.env.RABBITMQ_URL!;


const start = async () => {
    console.log(RABBITMQ_URL);
    
    const connection = await amqp.connect(RABBITMQ_URL)
    const channel = await connection.createChannel();

    await channel.assertExchange("orders", "topic", { durable: true });

    const queueName = "notification.order.created";
    await channel.assertQueue(queueName, { durable: true });

    (await channel).bindQueue(queueName, "orders", "order.created");

    console.log(`[Notification-service] waiting for events on ${queueName}...`);

    // Consume
    await channel.consume(queueName, (msg) => {
        if (!msg) return;

        const event = JSON.parse(msg.content.toString());
        console.log(`[notification-service] OrderCreated received:`, event);
        console.log(`  → Sending email to user ${event.userName} for ${event.productName}`);

        channel.ack(msg);   // tell the broker we processed it successfully
    });
}


start().catch((err) => {
    console.error("Failed to start notification-service:", err);
    process.exit(1);
});