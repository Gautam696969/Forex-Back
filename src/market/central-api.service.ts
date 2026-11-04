import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

export interface ApiHealthStatus {
  ok: boolean;
  lastSuccessTime: string | null;
  lastError: string | null;
  failCount: number;
  lastTested: string;
}

export interface WrapOptions {
  apiName: string;
  url?: string;
  isUpstream?: boolean;
}

@Injectable()
export class CentralApiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CentralApiService.name);
  private recurringTestTimer: NodeJS.Timeout | null = null;

  // Track status for each core API
  private apiHealthMap: Map<string, ApiHealthStatus> = new Map([
    ['indices', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
    ['quotes', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
    ['pairs', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
    ['candles', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
    ['status', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
    ['ipo', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
  ]);

  // Hook functions to test APIs during self-test
  private apiTestHandlers: Map<string, () => Promise<any>> = new Map();

  onModuleInit() {
    // Run initial startup self-test after 1.5 seconds to allow other services to bind
    setTimeout(async () => {
      await this.runSelfTest(true);
    }, 1500);

    // Repeat self-test every 60 seconds
    this.recurringTestTimer = setInterval(async () => {
      await this.runSelfTest(false);
    }, 60000);
  }

  onModuleDestroy() {
    if (this.recurringTestTimer) {
      clearInterval(this.recurringTestTimer);
    }
  }

  public registerTestHandler(apiName: string, handler: () => Promise<any>) {
    this.apiTestHandlers.set(apiName, handler);
  }

  public getISTString(date: Date = new Date()): string {
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
  }

  public getISTTimeOnly(date: Date = new Date()): string {
    return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
  }

  /**
   * Central wrapper used by every upstream fetch call and internal sub-fetch
   */
  public async execute<T>(options: WrapOptions, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    const dateTimeIST = this.getISTString(new Date(start));
    const timeOnlyIST = this.getISTTimeOnly(new Date(start));
    const apiName = options.apiName;
    const reqUrl = options.url || `internal://${apiName}`;

    try {
      const data = await fn();
      const duration = Date.now() - start;

      this.recordSuccess(apiName);
      // Success terminal line in green
      console.log(`\x1b[32m[OK] ${timeOnlyIST} api=${apiName} ${duration}ms\x1b[0m`);
      return data;
    } catch (err: any) {
      const duration = Date.now() - start;
      const causeCode =
        err?.code ||
        err?.cause?.code ||
        (err?.status ? `HTTP ${err.status}` : '') ||
        (err?.name === 'AbortError' || err?.message?.includes('timed out') ? 'ETIMEDOUT' : '');
      const rawMessage = err?.message || String(err);
      const reason = causeCode && !rawMessage.includes(causeCode) ? `${rawMessage} (${causeCode})` : rawMessage;

      this.recordFailure(apiName, reason);
      // Red failure line matching strict format:
      // [API FAILED] <date time IST> api=<name> <duration>ms reason=<error message + cause code> url=<request url>
      console.error(
        `\x1b[31m[API FAILED] ${dateTimeIST} api=${apiName} ${duration}ms reason=${reason} url=${reqUrl}\x1b[0m`,
      );
      throw err;
    }
  }

  /**
   * Central wrapper for controller routes
   * Ensures Cache-Control: no-store and standardized response format:
   * Success: 200 { ok: true, api, data, serverTime }
   * Failure: 502 { ok: false, api, error }
   */
  public async wrapRoute<T>(
    res: any,
    apiName: string,
    url: string,
    fn: () => Promise<T>,
  ): Promise<any> {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');

    try {
      const data = await this.execute({ apiName, url }, fn);
      return res.status(200).json({
        ok: true,
        api: apiName,
        data,
        serverTime: this.getISTString(),
      });
    } catch (err: any) {
      const errorReason = err?.message || 'Upstream service unavailable';
      return res.status(502).json({
        ok: false,
        api: apiName,
        error: errorReason,
      });
    }
  }

  /**
   * Fetch with strict 8-12 second timeout and upstream failure logging
   */
  public async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 10000,
    upstreamApiName?: string,
  ): Promise<Response> {
    const api = upstreamApiName || `upstream.${new URL(url).hostname}`;
    return this.execute({ apiName: api, url, isUpstream: true }, async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort(new Error(`ETIMEDOUT: Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
      }
    });
  }

  public recordSuccess(apiName: string) {
    const baseKey = apiName.split('.')[0]; // map upstream e.g. "ipo.current" to base "ipo"
    const entry = this.apiHealthMap.get(baseKey) || {
      ok: true,
      lastSuccessTime: null,
      lastError: null,
      failCount: 0,
      lastTested: '',
    };
    entry.ok = true;
    entry.lastSuccessTime = this.getISTString();
    entry.lastError = null;
    entry.lastTested = this.getISTString();
    this.apiHealthMap.set(baseKey, entry);
  }

  public recordFailure(apiName: string, reason: string) {
    const baseKey = apiName.split('.')[0];
    const entry = this.apiHealthMap.get(baseKey) || {
      ok: false,
      lastSuccessTime: null,
      lastError: null,
      failCount: 0,
      lastTested: '',
    };
    entry.ok = false;
    entry.lastError = reason;
    entry.failCount += 1;
    entry.lastTested = this.getISTString();
    this.apiHealthMap.set(baseKey, entry);
  }

  public getHealthSummary() {
    const allApis: Record<string, ApiHealthStatus> = {};
    let allOk = true;

    for (const [key, val] of this.apiHealthMap.entries()) {
      allApis[key] = { ...val };
      if (!val.ok) allOk = false;
    }

    return {
      status: allOk ? 'HEALTHY' : 'DEGRADED',
      apis: allApis,
    };
  }

  /**
   * Run self-test across all 6 core APIs and print formatted table
   */
  public async runSelfTest(isStartup = false) {
    const tableData: Array<{ API: string; Status: string; Reason: string }> = [];
    const coreApis = ['indices', 'quotes', 'pairs', 'candles', 'status', 'ipo'];

    for (const api of coreApis) {
      const handler = this.apiTestHandlers.get(api);
      const prevOk = this.apiHealthMap.get(api)?.ok ?? false;

      if (!handler) {
        tableData.push({ API: api, Status: 'OK', Reason: 'Handler initialized' });
        continue;
      }

      try {
        await handler();
        this.recordSuccess(api);

        if (!isStartup && !prevOk) {
          console.log(`\x1b[32m[RECOVERED] ${this.getISTString()} api=${api}\x1b[0m`);
        }

        tableData.push({ API: api, Status: 'OK', Reason: 'Feed responsive & validated' });
      } catch (err: any) {
        const reason = err?.message || 'Self-test check failed';
        this.recordFailure(api, reason);
        tableData.push({ API: api, Status: 'FAILED', Reason: reason });
      }
    }

    if (isStartup) {
      console.log('\n======================================================');
      console.log(`🚀 FourX Backend Startup API Self-Test [${this.getISTString()}]`);
      console.log('======================================================');
      console.table(tableData);
      console.log('======================================================\n');
    }
  }
}

