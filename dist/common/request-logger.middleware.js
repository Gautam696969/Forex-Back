var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let RequestLoggerMiddleware = class RequestLoggerMiddleware {
    use(req, res, next) {
        req._startTime = Date.now();
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                const duration = req._startTime ? Date.now() - req._startTime : 0;
                const timeIST = new Date().toLocaleTimeString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour12: false,
                }) + ' IST';
                const url = req.originalUrl || req.url || '';
                const cleanPath = url.split('?')[0].replace(/^\/api\//, '').replace(/^\//, '');
                const apiName = cleanPath.replace(/\//g, '.') || 'root';
                if (apiName !== 'health' && !apiName.includes('.js') && !apiName.includes('.ico')) {
                    console.log(`\x1b[32m[OK] ${timeIST} api=${apiName} ${duration}ms\x1b[0m`);
                }
            }
        });
        next();
    }
};
RequestLoggerMiddleware = __decorate([
    Injectable()
], RequestLoggerMiddleware);
export { RequestLoggerMiddleware };
//# sourceMappingURL=request-logger.middleware.js.map