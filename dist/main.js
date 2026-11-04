import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const port = Number(process.env.PORT) || 4000;
    try {
        await app.listen(port);
        console.log(`🚀 FourX Backend is running on: http://localhost:${port}`);
    }
    catch (err) {
        if (err?.code === 'EADDRINUSE') {
            console.error(`⚠️  Port ${port} is already in use. Run 'fuser -k ${port}/tcp' to release the port.`);
        }
        throw err;
    }
}
await bootstrap();
//# sourceMappingURL=main.js.map