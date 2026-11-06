import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { LogoService } from './logo.service.js';

@Controller(['logo', 'api/logo'])
export class LogoController {
  constructor(private readonly logoService: LogoService) {}

  @Get('health')
  async getHealth() {
    return await this.logoService.getHealth();
  }

  @Get('ipo/:name')
  async getIpoLogo(@Param('name') name: string, @Res() res: Response) {
    const symbolKey = name.startsWith('ipo:') ? name : `ipo:${name}`;
    return this.getLogo(symbolKey, res);
  }

  @Get(':symbol')
  async getLogo(@Param('symbol') symbol: string, @Res() res: Response) {
    try {
      const { buffer, contentType } = await this.logoService.getLogo(symbol);
      res.setHeader('Content-Type', contentType);
      // Proxy + Cache for 30 days (2,592,000 seconds, immutable)
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      return res.status(HttpStatus.OK).send(buffer);
    } catch (err: any) {
      const errorMsg =
        typeof err?.response === 'object' && err.response?.error
          ? err.response.error
          : err?.message || 'Logo not found';
      return res.status(HttpStatus.NOT_FOUND).json({
        ok: false,
        api: 'logo',
        error: errorMsg,
      });
    }
  }
}
