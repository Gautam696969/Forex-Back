var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch, HttpException, HttpStatus, } from '@nestjs/common';
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const start = request._startTime || Date.now();
        const duration = Math.max(0, Date.now() - start);
        const istTime = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: false,
        }) + ' IST';
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let reason = 'Internal Server Error';
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                reason = res;
            }
            else if (typeof res === 'object' && res !== null) {
                const msg = res.message;
                reason = Array.isArray(msg) ? msg.join(', ') : msg || res.error || exception.message;
            }
            else {
                reason = exception.message;
            }
        }
        else if (exception instanceof Error) {
            reason = exception.message;
        }
        else {
            reason = String(exception);
        }
        const url = request.originalUrl || request.url || '';
        const cleanPath = url.split('?')[0].replace(/^\/api\//, '').replace(/^\//, '');
        const apiName = cleanPath.replace(/\//g, '.') || 'root';
        const isExpectedAuthProbe = status === HttpStatus.UNAUTHORIZED &&
            (apiName.startsWith('auth.') || apiName === 'auth' || url.includes('/auth/'));
        if (!isExpectedAuthProbe) {
            console.error(`\x1b[31m[API FAILED] ${istTime} api=${apiName} ${duration}ms status=${status} reason=${reason} url=${url}\x1b[0m`);
        }
        if (status >= 500 && exception instanceof Error && exception.stack) {
            console.error(`\x1b[31m[STACK TRACE for ${apiName}]\x1b[0m\n${exception.stack}`);
        }
        response.status(status).json({
            ok: false,
            statusCode: status,
            api: apiName,
            error: reason,
            message: reason,
            timestamp: istTime,
        });
    }
};
AllExceptionsFilter = __decorate([
    Catch()
], AllExceptionsFilter);
export { AllExceptionsFilter };
//# sourceMappingURL=all-exceptions.filter.js.map