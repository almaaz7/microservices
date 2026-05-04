import Fastify from "fastify";
import { userRoutes } from "./routes/user.routes.js";
import { registerConfig } from "./config.js";
import { errorHandler } from "./plugins/errorHandler.js";
import { registerJwt } from "./plugins/jwt.js";
import { authRoutes } from "./routes/auth.routes.js";
import { registerAuthenticate } from "./plugins/authenticate.js";

const server = Fastify({logger: true})

await server.register(registerConfig)
await server.register(registerJwt)
await server.register(registerAuthenticate)
server.register(errorHandler)
server.register(authRoutes, { prefix: "/auth"})
server.register(userRoutes)

server.get('/health', async () => {
    return {
        status: 'ok',
        service: "User-service"
    }
});

const start = async () => {
    try{
        await server.listen({
            port: server.config.PORT,
            host: server.config.HOST
        });
    }catch(err){
        server.log.error(err)
        process.exit(1)
    }
}

start()