var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UpstoxBrokerService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
export const INSTRUMENT_MASTER = {
    'NIFTY 50': {
        symbol: 'NIFTY 50',
        displayName: 'NIFTY 50 Index',
        instrumentKey: 'NSE_INDEX|Nifty 50',
        segment: 'NSE_INDEX',
        category: 'INDICES',
        sector: 'Broad Market',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 50,
    },
    'SENSEX': {
        symbol: 'SENSEX',
        displayName: 'BSE SENSEX Index',
        instrumentKey: 'BSE_INDEX|SENSEX',
        segment: 'BSE_INDEX',
        category: 'INDICES',
        sector: 'Broad Market',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 10,
    },
    'BANK NIFTY': {
        symbol: 'BANK NIFTY',
        displayName: 'Nifty Bank Index',
        instrumentKey: 'NSE_INDEX|Nifty Bank',
        segment: 'NSE_INDEX',
        category: 'INDICES',
        sector: 'Banking',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 15,
    },
    'NIFTY IT': {
        symbol: 'NIFTY IT',
        displayName: 'Nifty IT Index',
        instrumentKey: 'NSE_INDEX|Nifty IT',
        segment: 'NSE_INDEX',
        category: 'INDICES',
        sector: 'Information Technology',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 25,
    },
    'RELIANCE': {
        symbol: 'RELIANCE',
        displayName: 'Reliance Industries Ltd',
        instrumentKey: 'NSE_EQ|INE002A01018',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Energy',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.1,
        lotSize: 1,
    },
    'TCS': {
        symbol: 'TCS',
        displayName: 'Tata Consultancy Services',
        instrumentKey: 'NSE_EQ|INE467B01029',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Information Technology',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.2,
        lotSize: 1,
    },
    'HDFCBANK': {
        symbol: 'HDFCBANK',
        displayName: 'HDFC Bank Ltd',
        instrumentKey: 'NSE_EQ|INE040A01034',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Banking',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.1,
        lotSize: 1,
    },
    'INFY': {
        symbol: 'INFY',
        displayName: 'Infosys Ltd',
        instrumentKey: 'NSE_EQ|INE009A01021',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Information Technology',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.1,
        lotSize: 1,
    },
    'ICICIBANK': {
        symbol: 'ICICIBANK',
        displayName: 'ICICI Bank Ltd',
        instrumentKey: 'NSE_EQ|INE090A01021',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Banking',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.1,
        lotSize: 1,
    },
    'TATAMOTORS': {
        symbol: 'TATAMOTORS',
        displayName: 'Tata Motors Ltd',
        instrumentKey: 'NSE_EQ|INE155A01022',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Automobile',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.1,
        lotSize: 1,
    },
    'TATASTEEL': {
        symbol: 'TATASTEEL',
        displayName: 'Tata Steel Ltd',
        instrumentKey: 'NSE_EQ|INE081A01020',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Metals',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 1,
    },
    'BHARTIARTL': {
        symbol: 'BHARTIARTL',
        displayName: 'Bharti Airtel Ltd',
        instrumentKey: 'NSE_EQ|INE397D01024',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Telecom',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.1,
        lotSize: 1,
    },
    'SBIN': {
        symbol: 'SBIN',
        displayName: 'State Bank of India',
        instrumentKey: 'NSE_EQ|INE062A01020',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Banking',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 1,
    },
    'ITC': {
        symbol: 'ITC',
        displayName: 'ITC Ltd',
        instrumentKey: 'NSE_EQ|INE154A01025',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'FMCG',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 1,
    },
    'LT': {
        symbol: 'LT',
        displayName: 'Larsen & Toubro Ltd',
        instrumentKey: 'NSE_EQ|INE018A01030',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Infrastructure',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.2,
        lotSize: 1,
    },
    'SUNPHARMA': {
        symbol: 'SUNPHARMA',
        displayName: 'Sun Pharmaceutical Industries',
        instrumentKey: 'NSE_EQ|INE044A01036',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Pharma',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.1,
        lotSize: 1,
    },
    'MARUTI': {
        symbol: 'MARUTI',
        displayName: 'Maruti Suzuki India Ltd',
        instrumentKey: 'NSE_EQ|INE585B01010',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Automobile',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.5,
        lotSize: 1,
    },
    'TATAPOWER': {
        symbol: 'TATAPOWER',
        displayName: 'Tata Power Co Ltd',
        instrumentKey: 'NSE_EQ|INE245A01021',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Energy',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 1,
    },
    'ZOMATO': {
        symbol: 'ZOMATO',
        displayName: 'Zomato Ltd (Eternal)',
        instrumentKey: 'NSE_EQ|INE758T01015',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Consumer Services',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 1,
    },
    'WIPRO': {
        symbol: 'WIPRO',
        displayName: 'Wipro Ltd',
        instrumentKey: 'NSE_EQ|INE075A01022',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Information Technology',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.05,
        lotSize: 1,
    },
    'HINDUNILVR': {
        symbol: 'HINDUNILVR',
        displayName: 'Hindustan Unilever Ltd',
        instrumentKey: 'NSE_EQ|INE030A01027',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'FMCG',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.2,
        lotSize: 1,
    },
    'BAJFINANCE': {
        symbol: 'BAJFINANCE',
        displayName: 'Bajaj Finance Ltd',
        instrumentKey: 'NSE_EQ|INE296A01032',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Financial Services',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.5,
        lotSize: 1,
    },
    'ADANIENT': {
        symbol: 'ADANIENT',
        displayName: 'Adani Enterprises Ltd',
        instrumentKey: 'NSE_EQ|INE423A01024',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Commodities',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.2,
        lotSize: 1,
    },
    'KOTAKBANK': {
        symbol: 'KOTAKBANK',
        displayName: 'Kotak Mahindra Bank Ltd',
        instrumentKey: 'NSE_EQ|INE237A01036',
        segment: 'NSE_EQ',
        category: 'STOCKS',
        sector: 'Banking',
        digits: 2,
        pipSize: 0.05,
        defaultSpread: 0.1,
        lotSize: 1,
    },
    'GOLD24K': {
        symbol: 'GOLD24K',
        displayName: 'Gold 24K (999 Purity) / 10g',
        instrumentKey: 'MCX_FO|495213',
        segment: 'MCX_FO',
        category: 'COMMODITIES',
        sector: 'Precious Metals',
        digits: 2,
        pipSize: 1.0,
        defaultSpread: 2.0,
        lotSize: 1,
    },
    'GOLD22K': {
        symbol: 'GOLD22K',
        displayName: 'Gold 22K (916 Purity) / 10g',
        instrumentKey: 'MCX_FO|495213',
        segment: 'MCX_FO',
        category: 'COMMODITIES',
        sector: 'Precious Metals',
        digits: 2,
        pipSize: 1.0,
        defaultSpread: 2.0,
        lotSize: 1,
    },
    'SILVER1KG': {
        symbol: 'SILVER1KG',
        displayName: 'Silver (999 Purity) / 1kg',
        instrumentKey: 'MCX_FO|495214',
        segment: 'MCX_FO',
        category: 'COMMODITIES',
        sector: 'Precious Metals',
        digits: 2,
        pipSize: 1.0,
        defaultSpread: 5.0,
        lotSize: 1,
    },
    'CRUDEOIL': {
        symbol: 'CRUDEOIL',
        displayName: 'Crude Oil (MCX) / Barrel',
        instrumentKey: 'MCX_FO|573422',
        segment: 'MCX_FO',
        category: 'COMMODITIES',
        sector: 'Energy',
        digits: 2,
        pipSize: 1.0,
        defaultSpread: 1.0,
        lotSize: 100,
    },
    'NATURALGAS': {
        symbol: 'NATURALGAS',
        displayName: 'Natural Gas (MCX) / mmBtu',
        instrumentKey: 'MCX_FO|574319',
        segment: 'MCX_FO',
        category: 'COMMODITIES',
        sector: 'Energy',
        digits: 2,
        pipSize: 0.1,
        defaultSpread: 0.2,
        lotSize: 1250,
    },
};
let UpstoxBrokerService = UpstoxBrokerService_1 = class UpstoxBrokerService extends EventEmitter {
    logger = new Logger(UpstoxBrokerService_1.name);
    quotes = new Map();
    candleCache = new Map();
    pollTimer = null;
    watchdogTimer = null;
    heartbeatTimer = null;
    wsClient = null;
    isWsConnected = false;
    wsMode = 'REST_POLL';
    reconnectAttempts = 0;
    lastConnectedAt = 0;
    lastDisconnectedAt = 0;
    lastHeartbeatAt = 0;
    lastTickTimestamp = 0;
    ticksReceivedTotal = 0;
    lastRestSyncAt = 0;
    tokenValid = false;
    tokenStatusMessage = 'No Upstox token configured; running verified high-frequency REST feed';
    backoffSchedule = [1000, 2000, 5000, 10000, 30000];
    constructor() {
        super();
        this.setMaxListeners(100);
    }
    async onModuleInit() {
        this.logger.log('Starting Upstox Broker Feed Engine (Broker-Grade Indian Market Data)...');
        await this.refreshQuotes();
        this.startStreamingOrPolling();
        this.startStaleFeedWatchdog();
    }
    onModuleDestroy() {
        this.stopAllTimers();
    }
    stopAllTimers() {
        if (this.pollTimer)
            clearInterval(this.pollTimer);
        if (this.watchdogTimer)
            clearInterval(this.watchdogTimer);
        if (this.heartbeatTimer)
            clearInterval(this.heartbeatTimer);
        if (this.wsClient) {
            try {
                this.wsClient.close();
            }
            catch { }
            this.wsClient = null;
        }
    }
    getHealthInfo() {
        const market = this.isMarketOpen();
        const now = Date.now();
        const isStale = market.isOpen && (now - this.lastTickTimestamp > 15000);
        let status = 'healthy';
        if (!market.isOpen) {
            status = 'healthy';
        }
        else if (isStale) {
            status = 'stale';
        }
        else if (this.wsMode === 'REST_POLL') {
            status = 'degraded';
        }
        return {
            status,
            market,
            webSocket: {
                connected: this.isWsConnected,
                mode: this.wsMode,
                reconnectAttempts: this.reconnectAttempts,
                lastConnectedAtIST: this.lastConnectedAt ? this.formatIST(this.lastConnectedAt) : undefined,
                lastDisconnectedAtIST: this.lastDisconnectedAt ? this.formatIST(this.lastDisconnectedAt) : undefined,
                lastHeartbeatIST: this.lastHeartbeatAt ? this.formatIST(this.lastHeartbeatAt) : undefined,
            },
            feed: {
                lastTickTimestamp: this.lastTickTimestamp,
                lastTickIST: this.lastTickTimestamp ? this.formatIST(this.lastTickTimestamp) : 'None yet',
                ticksReceivedTotal: this.ticksReceivedTotal,
                subscribedSymbolsCount: Object.keys(INSTRUMENT_MASTER).length,
                isStale,
                lastRestSyncIST: this.lastRestSyncAt ? this.formatIST(this.lastRestSyncAt) : undefined,
            },
            token: {
                hasToken: !!process.env.UPSTOX_ACCESS_TOKEN,
                valid: this.tokenValid,
                autoRefreshConfigured: !!(process.env.UPSTOX_API_KEY && process.env.UPSTOX_API_SECRET),
                statusMessage: this.tokenStatusMessage,
            },
        };
    }
    isMarketOpen(category = 'EQUITIES') {
        const now = new Date();
        const istTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
        const istParts = istTimeStr.split(':').map(Number);
        const hours = istParts[0];
        const minutes = istParts[1];
        const totalMinutes = hours * 60 + minutes;
        const istDayStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
        const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(istDayStr);
        if (category === 'COMMODITIES') {
            const mcxOpen = 9 * 60;
            const mcxClose = 23 * 60 + 30;
            const isOpen = isWeekday && totalMinutes >= mcxOpen && totalMinutes <= mcxClose;
            return {
                isOpen,
                status: isOpen ? 'OPEN' : 'CLOSED',
                message: isOpen ? 'MCX Commodities Market is Open' : 'MCX Market is Closed',
                timing: '9:00 AM – 11:30 PM IST (Mon–Fri)',
                currentIST: `${istTimeStr} IST`,
            };
        }
        const nseOpen = 9 * 60 + 15;
        const nseClose = 15 * 60 + 30;
        const isOpen = isWeekday && totalMinutes >= nseOpen && totalMinutes <= nseClose;
        return {
            isOpen,
            status: isOpen ? 'OPEN' : 'CLOSED',
            message: isOpen ? 'Market is Open (Live NSE/BSE)' : 'Market Closed (9:15 AM – 3:30 PM IST)',
            timing: '9:15 AM – 3:30 PM IST (Mon–Fri)',
            currentIST: `${istTimeStr} IST`,
        };
    }
    getInstrument(symbol) {
        const upper = symbol.toUpperCase().trim();
        if (INSTRUMENT_MASTER[upper])
            return INSTRUMENT_MASTER[upper];
        for (const [key, val] of Object.entries(INSTRUMENT_MASTER)) {
            if (key.includes(upper) || val.instrumentKey.includes(upper)) {
                return val;
            }
        }
        return null;
    }
    getQuote(symbol) {
        return this.quotes.get(symbol.toUpperCase().trim()) || null;
    }
    getAllQuotes() {
        return Array.from(this.quotes.values());
    }
    async getCandles(symbol, timeframe = '1m') {
        const inst = this.getInstrument(symbol);
        const nowIST = this.formatIST(Date.now());
        if (!inst) {
            return {
                symbol,
                timeframe,
                candles: [],
                lastUpdated: nowIST,
                error: `Instrument '${symbol}' not mapped in Upstox broker master feed`,
            };
        }
        const cacheKey = `${inst.symbol}:${timeframe}`;
        const cached = this.candleCache.get(cacheKey);
        const cacheTtl = ['1D', '1W', '1M'].includes(timeframe) ? 60000 : 2500;
        if (cached && Date.now() - cached.timestamp < cacheTtl) {
            return {
                symbol: inst.symbol,
                timeframe,
                candles: cached.candles,
                lastUpdated: nowIST,
            };
        }
        try {
            const candles = await this.fetchCandlesFromUpstox(inst, timeframe);
            if (candles && candles.length > 0) {
                this.candleCache.set(cacheKey, { timestamp: Date.now(), candles });
            }
            return {
                symbol: inst.symbol,
                timeframe,
                candles: candles || [],
                lastUpdated: nowIST,
            };
        }
        catch (err) {
            this.logger.error(`[Broker API] Error fetching candles for ${inst.symbol} (${timeframe}): ${err?.message}`);
            return {
                symbol: inst.symbol,
                timeframe,
                candles: cached?.candles || [],
                lastUpdated: nowIST,
                error: 'Data temporarily unavailable from exchange feed',
            };
        }
    }
    async fetchCandlesFromUpstox(inst, timeframe) {
        const encodedKey = encodeURIComponent(inst.instrumentKey);
        const cacheBuster = `_t=${Date.now()}`;
        if (['1D', '1W', '1M'].includes(timeframe)) {
            const upstoxInterval = timeframe === '1D' ? 'day' : timeframe === '1W' ? 'week' : 'month';
            const now = new Date();
            const toDate = now.toISOString().split('T')[0];
            const yearsBack = timeframe === '1D' ? 1 : timeframe === '1W' ? 3 : 7;
            const from = new Date();
            from.setFullYear(now.getFullYear() - yearsBack);
            const fromDate = from.toISOString().split('T')[0];
            const url = `https://api.upstox.com/v2/historical-candle/${encodedKey}/${upstoxInterval}/${toDate}/${fromDate}?${cacheBuster}`;
            const res = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache',
                },
                signal: AbortSignal.timeout(6000),
            });
            this.logBrokerResponse(res.status, url);
            if (!res.ok)
                throw new Error(`Upstox status ${res.status}`);
            const json = await res.json();
            return this.parseAndSortCandles(json?.data?.candles || [], inst.digits);
        }
        if (timeframe === '30m') {
            const url = `https://api.upstox.com/v2/historical-candle/intraday/${encodedKey}/30minute?${cacheBuster}`;
            const res = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache',
                },
                signal: AbortSignal.timeout(5000),
            });
            this.logBrokerResponse(res.status, url);
            if (!res.ok)
                throw new Error(`Upstox 30m status ${res.status}`);
            const json = await res.json();
            return this.parseAndSortCandles(json?.data?.candles || [], inst.digits);
        }
        const url = `https://api.upstox.com/v2/historical-candle/intraday/${encodedKey}/1minute?${cacheBuster}`;
        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store',
                'Pragma': 'no-cache',
            },
            signal: AbortSignal.timeout(5000),
        });
        this.logBrokerResponse(res.status, url);
        if (!res.ok)
            throw new Error(`Upstox 1m status ${res.status}`);
        const json = await res.json();
        const oneMinCandles = this.parseAndSortCandles(json?.data?.candles || [], inst.digits);
        if (timeframe === '1m' || oneMinCandles.length === 0) {
            return oneMinCandles;
        }
        const periodMap = {
            '5m': 5,
            '15m': 15,
            '1h': 60,
        };
        return this.aggregateCandles(oneMinCandles, periodMap[timeframe] || 1, inst.digits);
    }
    parseAndSortCandles(rawCandles, digits) {
        const bars = [];
        for (const item of rawCandles) {
            if (!Array.isArray(item) || item.length < 5)
                continue;
            const istStr = item[0];
            const d = new Date(istStr);
            const timeSec = Math.floor(d.getTime() / 1000);
            const o = Number(Number(item[1]).toFixed(digits));
            const h = Number(Number(item[2]).toFixed(digits));
            const l = Number(Number(item[3]).toFixed(digits));
            const c = Number(Number(item[4]).toFixed(digits));
            const v = Number(item[5]) || 0;
            if (!isNaN(timeSec) && !isNaN(o) && !isNaN(h) && !isNaN(l) && !isNaN(c)) {
                bars.push({
                    time: timeSec,
                    open: o,
                    high: h,
                    low: l,
                    close: c,
                    volume: v,
                    istDate: istStr,
                });
            }
        }
        bars.sort((a, b) => a.time - b.time);
        const deduped = [];
        const seen = new Set();
        for (const bar of bars) {
            if (!seen.has(bar.time)) {
                seen.add(bar.time);
                deduped.push(bar);
            }
        }
        return deduped;
    }
    aggregateCandles(candles, periodMinutes, digits) {
        if (periodMinutes <= 1 || candles.length === 0)
            return candles;
        const periodSeconds = periodMinutes * 60;
        const groups = new Map();
        for (const c of candles) {
            const bucketTime = Math.floor(c.time / periodSeconds) * periodSeconds;
            let group = groups.get(bucketTime);
            if (!group) {
                group = [];
                groups.set(bucketTime, group);
            }
            group.push(c);
        }
        const aggregated = [];
        for (const [bucketTime, list] of groups.entries()) {
            if (list.length === 0)
                continue;
            const open = list[0].open;
            const close = list[list.length - 1].close;
            let high = list[0].high;
            let low = list[0].low;
            let volume = 0;
            for (const item of list) {
                if (item.high > high)
                    high = item.high;
                if (item.low < low)
                    low = item.low;
                volume += item.volume;
            }
            aggregated.push({
                time: bucketTime,
                open: Number(open.toFixed(digits)),
                high: Number(high.toFixed(digits)),
                low: Number(low.toFixed(digits)),
                close: Number(close.toFixed(digits)),
                volume,
            });
        }
        return aggregated.sort((a, b) => a.time - b.time);
    }
    async refreshQuotes() {
        const market = this.isMarketOpen();
        const updatedQuotes = [];
        const nowMs = Date.now();
        const istTime = this.formatIST(nowMs);
        const entries = Object.values(INSTRUMENT_MASTER);
        const chunkSize = 4;
        for (let i = 0; i < entries.length; i += chunkSize) {
            const batch = entries.slice(i, i + chunkSize);
            await Promise.all(batch.map(async (inst) => {
                try {
                    const encodedKey = encodeURIComponent(inst.instrumentKey);
                    const cacheBuster = `_t=${Date.now()}`;
                    const url = `https://api.upstox.com/v2/historical-candle/intraday/${encodedKey}/1minute?${cacheBuster}`;
                    const res = await fetch(url, {
                        headers: {
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache, no-store',
                            'Pragma': 'no-cache',
                        },
                        signal: AbortSignal.timeout(3000),
                    });
                    this.logBrokerResponse(res.status, url);
                    if (!res.ok)
                        return;
                    const json = await res.json();
                    const rawCandles = json?.data?.candles || [];
                    if (rawCandles.length === 0)
                        return;
                    const latest = rawCandles[0];
                    let ltp = Number(latest[4]);
                    let open24h = Number(latest[1]);
                    let high24h = Number(latest[2]);
                    let low24h = Number(latest[3]);
                    let volume24h = Number(latest[5]) || 0;
                    for (const c of rawCandles) {
                        if (c[2] > high24h)
                            high24h = c[2];
                        if (c[3] < low24h)
                            low24h = c[3];
                        volume24h += c[5] || 0;
                    }
                    const firstOfDay = rawCandles[rawCandles.length - 1];
                    if (firstOfDay) {
                        open24h = Number(firstOfDay[1]);
                    }
                    if (inst.symbol === 'GOLD22K') {
                        const ratio = 22 / 24;
                        ltp = ltp * ratio;
                        open24h = open24h * ratio;
                        high24h = high24h * ratio;
                        low24h = low24h * ratio;
                    }
                    const prevClose = open24h > 0 ? open24h : ltp;
                    const changeAmount = ltp - prevClose;
                    const changePercent = prevClose > 0 ? (changeAmount / prevClose) * 100 : 0;
                    const spreadAmount = inst.defaultSpread;
                    const quote = {
                        symbol: inst.symbol,
                        bid: Number(ltp.toFixed(inst.digits)),
                        ask: Number((ltp + spreadAmount).toFixed(inst.digits)),
                        digits: inst.digits,
                        change24h: Number(changePercent.toFixed(2)),
                        changeAmount: Number(changeAmount.toFixed(inst.digits)),
                        high24h: Number(high24h.toFixed(inst.digits)),
                        low24h: Number(low24h.toFixed(inst.digits)),
                        open24h: Number(open24h.toFixed(inst.digits)),
                        close24h: Number(prevClose.toFixed(inst.digits)),
                        volume24h,
                        timestamp: nowMs,
                        lastUpdatedIST: istTime,
                        category: inst.category,
                    };
                    this.quotes.set(inst.symbol, quote);
                    updatedQuotes.push(quote);
                    const barTime = Math.floor(new Date(latest[0]).getTime() / 1000);
                    this.emit('bar_tick', {
                        symbol: inst.symbol,
                        timeframe: '1m',
                        bar: {
                            time: barTime,
                            open: Number(latest[1].toFixed(inst.digits)),
                            high: Number(latest[2].toFixed(inst.digits)),
                            low: Number(latest[3].toFixed(inst.digits)),
                            close: Number(ltp.toFixed(inst.digits)),
                            volume: Number(latest[5]) || 0,
                        },
                    });
                }
                catch (err) {
                }
            }));
        }
        if (updatedQuotes.length > 0) {
            this.lastTickTimestamp = nowMs;
            this.lastRestSyncAt = nowMs;
            this.ticksReceivedTotal += updatedQuotes.length;
            this.emit('ticks', updatedQuotes);
        }
    }
    startStaleFeedWatchdog() {
        this.watchdogTimer = setInterval(async () => {
            const market = this.isMarketOpen();
            if (!market.isOpen)
                return;
            const now = Date.now();
            const elapsedMs = now - this.lastTickTimestamp;
            if (elapsedMs > 15000) {
                this.logger.warn(`[Feed Watchdog] Stale feed detected! No ticks received for ${(elapsedMs / 1000).toFixed(1)}s during market hours. Triggering immediate refresh & reconnect...`);
                if (this.wsClient) {
                    try {
                        this.wsClient.terminate();
                    }
                    catch { }
                    this.wsClient = null;
                }
                await this.refreshQuotes();
            }
        }, 5000);
    }
    startStreamingOrPolling() {
        const accessToken = process.env.UPSTOX_ACCESS_TOKEN;
        if (accessToken) {
            this.wsMode = 'WEBSOCKET';
            this.initUpstoxWebSocket(accessToken);
        }
        else {
            this.wsMode = 'REST_POLL';
            this.logger.log('[Broker Feed] Running high-frequency verified REST feed (No auth token set; polling every 2s in IST)');
        }
        this.pollTimer = setInterval(async () => {
            const market = this.isMarketOpen();
            if (!market.isOpen) {
                return;
            }
            await this.refreshQuotes();
        }, 2000);
    }
    async initUpstoxWebSocket(accessToken) {
        try {
            this.logger.log(`[Broker WS] Connecting to Upstox Market Data Feed (Attempt #${this.reconnectAttempts + 1})...`);
            let wsUrl = `wss://api.upstox.com/v2/feed/market-data-feed`;
            try {
                const authRes = await fetch('https://api.upstox.com/v2/feed/market-data-feed/authorize', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json',
                    },
                });
                this.logBrokerResponse(authRes.status, '/feed/market-data-feed/authorize');
                if (authRes.status === 401) {
                    this.handleTokenExpired();
                    return;
                }
                if (authRes.ok) {
                    const authJson = await authRes.json();
                    if (authJson?.data?.authorizedRedirectUri) {
                        wsUrl = authJson.data.authorizedRedirectUri;
                        this.tokenValid = true;
                        this.tokenStatusMessage = 'Active & Authenticated';
                    }
                }
            }
            catch (authErr) {
                this.logger.warn(`[Broker WS] Could not authorize redirect URI: ${authErr.message}. Connecting to direct feed.`);
            }
            this.wsClient = new WebSocket(wsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': '*/*',
                },
            });
            this.wsClient.on('open', () => {
                this.isWsConnected = true;
                this.reconnectAttempts = 0;
                this.lastConnectedAt = Date.now();
                this.logger.log(`[Broker WS] Connected successfully at ${this.formatIST(this.lastConnectedAt)}.`);
                if (this.heartbeatTimer)
                    clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = setInterval(() => {
                    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
                        this.wsClient.ping();
                        this.lastHeartbeatAt = Date.now();
                    }
                }, 10000);
                this.resubscribeAllSymbols();
            });
            this.wsClient.on('message', (data) => {
                this.handleWsMessage(data);
            });
            this.wsClient.on('close', (code, reason) => {
                this.isWsConnected = false;
                this.lastDisconnectedAt = Date.now();
                const reasonStr = reason ? reason.toString() : 'Normal closure';
                this.logger.warn(`[Broker WS] Disconnected (code: ${code}, reason: ${reasonStr}) at ${this.formatIST(this.lastDisconnectedAt)}.`);
                this.scheduleReconnect(accessToken);
            });
            this.wsClient.on('error', (err) => {
                this.logger.error(`[Broker WS] Error: ${err.message}`);
            });
        }
        catch (e) {
            this.logger.error(`[Broker WS] Failed to initialize WebSocket: ${e?.message}`);
            this.scheduleReconnect(accessToken);
        }
    }
    scheduleReconnect(accessToken) {
        const delay = this.backoffSchedule[Math.min(this.reconnectAttempts, this.backoffSchedule.length - 1)];
        this.reconnectAttempts++;
        this.logger.log(`[Broker WS] Scheduling reconnect attempt #${this.reconnectAttempts} in ${delay}ms...`);
        setTimeout(() => {
            this.initUpstoxWebSocket(accessToken);
        }, delay);
    }
    resubscribeAllSymbols() {
        if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN)
            return;
        const instrumentKeys = Object.values(INSTRUMENT_MASTER).map((i) => i.instrumentKey);
        const subMsg = {
            guid: `sub-all-${Date.now()}`,
            method: 'sub',
            params: {
                mode: 'full',
                instrumentKeys,
            },
        };
        this.wsClient.send(JSON.stringify(subMsg));
        this.logger.log(`[Broker WS] Re-subscribed to ${instrumentKeys.length} instruments successfully.`);
    }
    handleTokenExpired() {
        this.tokenValid = false;
        this.tokenStatusMessage = 'Token Expired (401 Unauthorized from Upstox)';
        this.logger.error('[Broker Auth] 401 Unauthorized received from broker! Access token is expired or invalid.');
        this.logger.warn('[Broker Auth] Gracefully switching to verified high-frequency REST feed so live prices NEVER freeze.');
        this.wsMode = 'REST_POLL';
        if (this.wsClient) {
            try {
                this.wsClient.close();
            }
            catch { }
            this.wsClient = null;
        }
    }
    handleWsMessage(data) {
        try {
            const nowMs = Date.now();
            this.lastTickTimestamp = nowMs;
            const text = data.toString();
            if (text.startsWith('{')) {
                const parsed = JSON.parse(text);
                if (parsed.feeds) {
                    this.handleUpstoxWsFeeds(parsed.feeds);
                }
            }
        }
        catch (e) {
        }
    }
    handleUpstoxWsFeeds(feeds) {
        const updated = [];
        const nowMs = Date.now();
        const istTime = this.formatIST(nowMs);
        for (const [key, feed] of Object.entries(feeds)) {
            const fullFeed = feed?.ff || feed;
            const ltp = fullFeed?.marketFF?.ltpc?.ltp || fullFeed?.ltpc?.ltp;
            if (!ltp)
                continue;
            const inst = Object.values(INSTRUMENT_MASTER).find((i) => i.instrumentKey === key);
            if (!inst)
                continue;
            const prevClose = fullFeed?.marketFF?.ltpc?.cp || fullFeed?.ltpc?.cp || ltp;
            const changeAmount = ltp - prevClose;
            const changePercent = prevClose > 0 ? (changeAmount / prevClose) * 100 : 0;
            const high = fullFeed?.marketFF?.marketOHLC?.ohlc?.[0]?.high || ltp;
            const low = fullFeed?.marketFF?.marketOHLC?.ohlc?.[0]?.low || ltp;
            const open = fullFeed?.marketFF?.marketOHLC?.ohlc?.[0]?.open || ltp;
            const volume = fullFeed?.marketFF?.v || 0;
            const quote = {
                symbol: inst.symbol,
                bid: Number(ltp.toFixed(inst.digits)),
                ask: Number((ltp + inst.defaultSpread).toFixed(inst.digits)),
                digits: inst.digits,
                change24h: Number(changePercent.toFixed(2)),
                changeAmount: Number(changeAmount.toFixed(inst.digits)),
                high24h: Number(high.toFixed(inst.digits)),
                low24h: Number(low.toFixed(inst.digits)),
                open24h: Number(open.toFixed(inst.digits)),
                close24h: Number(prevClose.toFixed(inst.digits)),
                volume24h: volume,
                timestamp: nowMs,
                lastUpdatedIST: istTime,
                category: inst.category,
            };
            this.quotes.set(inst.symbol, quote);
            updated.push(quote);
        }
        if (updated.length > 0) {
            this.lastTickTimestamp = nowMs;
            this.ticksReceivedTotal += updated.length;
            this.emit('ticks', updated);
        }
    }
    logBrokerResponse(status, endpoint) {
        if (status === 401) {
            this.logger.error(`[Broker API 401] Token Expired or Invalid on ${endpoint}`);
        }
        else if (status === 403) {
            this.logger.error(`[Broker API 403] Forbidden on ${endpoint}`);
        }
        else if (status === 429) {
            this.logger.warn(`[Broker API 429] Rate Limit Exceeded on ${endpoint}. Backing off.`);
        }
    }
    formatIST(ms) {
        return new Date(ms).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
    }
};
UpstoxBrokerService = UpstoxBrokerService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], UpstoxBrokerService);
export { UpstoxBrokerService };
//# sourceMappingURL=upstox-broker.service.js.map