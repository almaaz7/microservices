import Fastify from "fastify";
import { orderRoute } from "./routes/order.routes.js";
import { registerConfig } from "./config.js";
import { registerJwt } from "./plugins/jwt.js";
import { registerAuthenticate } from "./plugins/authenticate.js";
import { registerRabbitMQ } from "./plugins/rabbitmq.js";

const server = Fastify({logger: true});

await server.register(registerConfig)
await server.register(registerJwt)
await server.register(registerAuthenticate)
await server.register(registerRabbitMQ)

server.register(orderRoute)


server.get('/order-service/health', async () => {
    return {
        status: 'OK',
        service: 'Order-Service'
    }
})

const start = async () => {
    try{
        await server.listen({
            port: server.config.PORT,
            host: server.config.HOST
        })
    }catch(err){
        server.log.error(err);
        process.exit(1);
    }
}

start();