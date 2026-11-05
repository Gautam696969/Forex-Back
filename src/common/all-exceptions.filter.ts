import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface CustomRequest extends Request {
  _startTime?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<CustomRequest>();

    const start = request._startTime || Date.now();
    const duration = Math.max(0, Date.now() - start);

    const istTime =
      new Date().toLocaleString('en-IN', {
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
      } else if (typeof res === 'object' && res !== null) {
        const msg = (res as any).message;
        reason = Array.isArray(msg) ? msg.join(', ') : msg || (res as any).error || exception.message;
      } else {
        reason = exception.message;
      }
    } else if (exception instanceof Error) {
      reason = exception.message;
    } else {
      reason = String(exception);
    }

    // Determine clean api name from URL path
    const url = request.originalUrl || request.url || '';
    const cleanPath = url.split('?')[0].replace(/^\/api\//, '').replace(/^\//, '');
    const apiName = cleanPath.replace(/\//g, '.') || 'root';

    // Strict red terminal failure log
    // Format: [API FAILED] <time IST> api=<name> <ms>ms status=<code> reason=<message> url=<url>
    console.error(
      `\x1b[31m[API FAILED] ${istTime} api=${apiName} ${duration}ms status=${status} reason=${reason} url=${url}\x1b[0m`,
    );

    // If 500 server error, print full stack trace
    if (status >= 500 && exception instanceof Error && exception.stack) {
      console.error(`\x1b[31m[STACK TRACE for ${apiName}]\x1b[0m\n${exception.stack}`);
    }

    // Return structured JSON response
    response.status(status).json({
      ok: false,
      statusCode: status,
      api: apiName,
      error: reason,
      message: reason,
      timestamp: istTime,
    });
  }
}

