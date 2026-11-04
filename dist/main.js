import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
process.on('unhandledRejection', (reason) => {
    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
    console.error(`\x1b[31m[UNHANDLED REJECTION] ${istTime} reason=${reason?.message || reason}\x1b[0m`, reason);
});
process.on('uncaughtException', (err) => {
    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
    console.error(`\x1b[31m[UNCAUGHT EXCEPTION] ${istTime} reason=${err?.message || err}\x1b[0m`, err);
});
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
    }));
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        skipSuccessfulRequests: true,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            statusCode: 429,
            message: 'Too many attempts. Please try again after 15 minutes.',
            error: 'Too Many Requests',
        },
    });
    app.use([
        '/auth/login',
        '/api/auth/login',
        '/auth/send-otp',
        '/api/auth/send-otp',
        '/auth/send-email-otp',
        '/api/auth/send-email-otp',
    ], authLimiter);
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const port = Number(process.env.PORT) || 4000;
    try {
        await app.listen(port, '0.0.0.0');
        console.log(`🚀 FourX Backend is running on: http://0.0.0.0:${port} (IPv4 + IPv6)`);
    }
    catch (err) {
        if (err?.code === 'EADDRINUSE') {
            console.error(`⚠️  Port ${port} is already in use. Run 'fuser -k ${port}/tcp' to release the port.`);
        }
        process.exit(1);
    }
}
await bootstrap();
//# sourceMappingURL=main.js.map