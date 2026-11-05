import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface CustomRequest extends Request {
  _startTime?: number;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: CustomRequest, res: Response, next: NextFunction) {
    req._startTime = Date.now();

    res.on('finish', () => {
      // Only log successes here; failures are caught and logged in AllExceptionsFilter
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const duration = req._startTime ? Date.now() - req._startTime : 0;
        const timeIST =
          new Date().toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: false,
          }) + ' IST';
        const url = req.originalUrl || req.url || '';
        const cleanPath = url.split('?')[0].replace(/^\/api\//, '').replace(/^\//, '');
        const apiName = cleanPath.replace(/\//g, '.') || 'root';

        // Do not spam terminal with heartbeat or static assets if any
        if (apiName !== 'health' && !apiName.includes('.js') && !apiName.includes('.ico')) {
          console.log(`\x1b[32m[OK] ${timeIST} api=${apiName} ${duration}ms\x1b[0m`);
        }
      }
    });

    next();
  }
}

