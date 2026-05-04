import Fastify from "fastify";
import { productRoutes } from "./routes/product.routes.js";
import { registerConfig } from "./config.js";
import { registerJwt } from "./plugins/jwt.js";
import { registerAuthenticate } from "./plugins/authenticate.js";

const server = Fastify({logger: true})
await server.register(registerConfig)
await server.register(registerJwt);
await server.register(registerAuthenticate)

server.register(productRoutes)

server.get('/product-service/healty', async () => {
    return {
        status: 'OK',
        service: 'Product-Service'
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
        process.exit(1)
    }
}

start();