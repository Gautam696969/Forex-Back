var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CentralApiService_1;
import { Injectable, Logger } from '@nestjs/common';
let CentralApiService = CentralApiService_1 = class CentralApiService {
    logger = new Logger(CentralApiService_1.name);
    recurringTestTimer = null;
    apiHealthMap = new Map([
        ['indices', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
        ['quotes', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
        ['pairs', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
        ['candles', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
        ['status', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
        ['ipo', { ok: true, lastSuccessTime: null, lastError: null, failCount: 0, lastTested: '' }],
    ]);
    apiTestHandlers = new Map();
    onModuleInit() {
        setTimeout(async () => {
            await this.runSelfTest(true);
        }, 1500);
        this.recurringTestTimer = setInterval(async () => {
            await this.runSelfTest(false);
        }, 60000);
    }
    onModuleDestroy() {
        if (this.recurringTestTimer) {
            clearInterval(this.recurringTestTimer);
        }
    }
    registerTestHandler(apiName, handler) {
        this.apiTestHandlers.set(apiName, handler);
    }
    getISTString(date = new Date()) {
        return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
    }
    getISTTimeOnly(date = new Date()) {
        return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
    }
    async execute(options, fn) {
        const start = Date.now();
        const dateTimeIST = this.getISTString(new Date(start));
        const timeOnlyIST = this.getISTTimeOnly(new Date(start));
        const apiName = options.apiName;
        const reqUrl = options.url || `internal://${apiName}`;
        try {
            const data = await fn();
            const duration = Date.now() - start;
            this.recordSuccess(apiName);
            console.log(`\x1b[32m[OK] ${timeOnlyIST} api=${apiName} ${duration}ms\x1b[0m`);
            return data;
        }
        catch (err) {
            const duration = Date.now() - start;
            const causeCode = err?.code ||
                err?.cause?.code ||
                (err?.status ? `HTTP ${err.status}` : '') ||
                (err?.name === 'AbortError' || err?.message?.includes('timed out') ? 'ETIMEDOUT' : '');
            const rawMessage = err?.message || String(err);
            const reason = causeCode && !rawMessage.includes(causeCode) ? `${rawMessage} (${causeCode})` : rawMessage;
            this.recordFailure(apiName, reason);
            console.error(`\x1b[31m[API FAILED] ${dateTimeIST} api=${apiName} ${duration}ms reason=${reason} url=${reqUrl}\x1b[0m`);
            throw err;
        }
    }
    async wrapRoute(res, apiName, url, fn) {
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
        }
        catch (err) {
            const errorReason = err?.message || 'Upstream service unavailable';
            return res.status(502).json({
                ok: false,
                api: apiName,
                error: errorReason,
            });
        }
    }
    async fetchWithTimeout(url, options = {}, timeoutMs = 10000, upstreamApiName) {
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
            }
            catch (err) {
                clearTimeout(timeoutId);
                throw err;
            }
        });
    }
    recordSuccess(apiName) {
        const baseKey = apiName.split('.')[0];
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
    recordFailure(apiName, reason) {
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
    getHealthSummary() {
        const allApis = {};
        let allOk = true;
        for (const [key, val] of this.apiHealthMap.entries()) {
            allApis[key] = { ...val };
            if (!val.ok)
                allOk = false;
        }
        return {
            status: allOk ? 'HEALTHY' : 'DEGRADED',
            apis: allApis,
        };
    }
    async runSelfTest(isStartup = false) {
        const tableData = [];
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
            }
            catch (err) {
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
};
CentralApiService = CentralApiService_1 = __decorate([
    Injectable()
], CentralApiService);
export { CentralApiService };
//# sourceMappingURL=central-api.service.js.map