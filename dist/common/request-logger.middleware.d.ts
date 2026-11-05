import { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
interface CustomRequest extends Request {
    _startTime?: number;
}
export declare class RequestLoggerMiddleware implements NestMiddleware {
    use(req: CustomRequest, res: Response, next: NextFunction): void;
}
export {};
