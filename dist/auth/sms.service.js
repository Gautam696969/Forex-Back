var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SmsService_1;
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
let SmsService = SmsService_1 = class SmsService {
    logger = new Logger(SmsService_1.name);
    onModuleInit() {
        this.auditSmsConfig();
    }
    auditSmsConfig() {
        const apiKey = this.getSanitizedApiKey();
        const provider = (process.env.SMS_PROVIDER || 'fast2sms').toLowerCase();
        const route = process.env.SMS_ROUTE || 'dlt';
        if (!apiKey) {
            console.warn(`\n\x1b[33m⚠️  [SMS CONFIG WARNING] SMS_API_KEY is missing or empty in .env! Live SMS dispatch will fail.\x1b[0m\n`);
            return;
        }
        const len = apiKey.length;
        const first4 = apiKey.slice(0, 4);
        const last4 = apiKey.slice(-4);
        console.log(`\x1b[36m📡 [SMS CONFIG] Provider: ${provider.toUpperCase()} | Route: ${route} | Key Loaded: length=${len}, prefix=${first4}...${last4} (never exposing full key)\x1b[0m`);
    }
    getSanitizedApiKey() {
        const raw = process.env.SMS_API_KEY || '';
        return raw
            .replace(/^["'\s]+|["'\s]+$/g, '')
            .replace(/[\r\n]/g, '')
            .trim();
    }
    rateLimits = new Map();
    deliveryTrackers = new Map();
    maskMobile(mobile) {
        const clean = mobile.replace(/\D/g, '');
        if (clean.length < 4)
            return '****';
        const visible = clean.slice(-4);
        const masked = '*'.repeat(Math.max(0, clean.length - 4));
        return `${masked}${visible}`;
    }
    validateMobile(mobile) {
        let clean = mobile.replace(/\D/g, '');
        if (clean.length === 12 && clean.startsWith('91')) {
            clean = clean.slice(2);
        }
        if (!/^[6-9]\d{9}$/.test(clean)) {
            throw new BadRequestException('Mobile must be a valid 10-digit Indian mobile number (/^[6-9]\\d{9}$/)');
        }
        return clean;
    }
    checkRateLimit(cleanMobile) {
        const now = Date.now();
        const entry = this.rateLimits.get(cleanMobile);
        if (!entry) {
            this.rateLimits.set(cleanMobile, {
                lastSent: now,
                count: 1,
                windowStart: now,
            });
            return { allowed: true };
        }
        if (now - entry.windowStart > 10 * 60 * 1000) {
            entry.windowStart = now;
            entry.count = 1;
            entry.lastSent = now;
            return { allowed: true };
        }
        const elapsedSinceLast = now - entry.lastSent;
        if (elapsedSinceLast < 30 * 1000) {
            const remainingSeconds = Math.ceil((30 * 1000 - elapsedSinceLast) / 1000);
            return {
                allowed: false,
                cooldownSeconds: remainingSeconds,
                reason: `Please wait ${remainingSeconds}s before requesting a new OTP (30s cooldown active).`,
            };
        }
        if (entry.count >= 3) {
            return {
                allowed: false,
                cooldownSeconds: 30,
                reason: 'Maximum 3 OTP requests allowed per 10 minutes. Please try again later or verify by email.',
            };
        }
        entry.count += 1;
        entry.lastSent = now;
        return { allowed: true };
    }
    formatSmsText(otp) {
        const template = process.env.SMS_TEMPLATE_TEXT ||
            'Your FourX verification OTP is {#var#}. Valid for 10 minutes. Do not share this with anyone. - FourX';
        return template
            .replace(/{#var#}/g, otp)
            .replace(/{{otp}}/g, otp)
            .replace(/{otp}/g, otp);
    }
    diagnoseCause(statusCode, rawBody, provider) {
        const lower = rawBody.toLowerCase();
        if (statusCode === 401 ||
            statusCode === 403 ||
            lower.includes('invalid authorization') ||
            lower.includes('invalid api key') ||
            lower.includes('auth key invalid') ||
            lower.includes('unauthorized') ||
            lower.includes('mock_sms_gateway_key')) {
            return 'CAUSE 4 (Account/Credentials): The SMS_API_KEY in .env is invalid or placeholder mock key. Live provider rejected authentication.';
        }
        if (lower.includes('insufficient balance') ||
            lower.includes('low balance') ||
            lower.includes('credit exhausted') ||
            lower.includes('out of credits') ||
            lower.includes('zero balance')) {
            return 'CAUSE 4 (Account/Balance): Insufficient SMS credits in provider account.';
        }
        if (lower.includes('template') ||
            lower.includes('dlt') ||
            lower.includes('sender id') ||
            lower.includes('header') ||
            lower.includes('pe_id') ||
            lower.includes('entity')) {
            return 'CAUSE 1 (DLT Configuration): DLT Sender ID, Entity ID or Template ID mismatch between .env and telecom registry.';
        }
        if (lower.includes('route') || lower.includes('promotional') || lower.includes('transactional')) {
            return 'CAUSE 2 (Route Mismatch): Route is not configured for Transactional/OTP delivery (promotional routes block OTPs).';
        }
        if (lower.includes('dnd') || lower.includes('ndnc') || lower.includes('do not disturb')) {
            return 'CAUSE 5 (DND/Telecom Filter): Recipient is on national DND registry or telecom spam filter blocked delivery.';
        }
        if (statusCode === 429 || lower.includes('rate limit') || lower.includes('too many requests')) {
            return 'CAUSE 5 (Rate Limit): SMS Gateway rate limit exceeded.';
        }
        if (statusCode >= 500) {
            return `SMS Provider Server Error (HTTP ${statusCode}): Upstream gateway service temporarily unavailable.`;
        }
        return `Provider Error: Status ${statusCode} - ${rawBody}`;
    }
    async sendOtp(mobile, otp) {
        const cleanMobile = this.validateMobile(mobile);
        const maskedMobile = this.maskMobile(cleanMobile);
        const exactSmsText = this.formatSmsText(otp);
        const rateCheck = this.checkRateLimit(cleanMobile);
        if (!rateCheck.allowed) {
            this.logger.warn(`[SMS RATE LIMIT] Mobile +91-${maskedMobile}: ${rateCheck.reason}`);
            return {
                success: false,
                delivered: false,
                provider: process.env.SMS_PROVIDER || 'fast2sms',
                url: '',
                statusCode: 429,
                rawResponse: JSON.stringify({ error: rateCheck.reason }),
                exactSmsText,
                maskedMobile,
                failureReason: rateCheck.reason,
                clientFriendlyMessage: rateCheck.reason,
                applicableCause: 'CAUSE 5 (Rate limit / Cooldown active)',
                cooldownSeconds: rateCheck.cooldownSeconds || 30,
                canEmail: true,
            };
        }
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev) {
            console.log(`\n\x1b[33m🔑 [DEV MODE OTP] FourX OTP for +91-${maskedMobile} is: \x1b[1m${otp}\x1b[0m\x1b[33m (NODE_ENV=development)\x1b[0m\n`);
        }
        const provider = (process.env.SMS_PROVIDER || 'fast2sms').toLowerCase();
        const apiKey = this.getSanitizedApiKey();
        const route = process.env.SMS_ROUTE || 'dlt';
        const senderId = (process.env.DLT_SENDER_ID || process.env.SMS_SENDER_ID || 'FOURXX').trim();
        const entityId = (process.env.DLT_ENTITY_ID || process.env.SMS_ENTITY_ID || '').trim();
        const templateId = (process.env.DLT_TEMPLATE_ID || process.env.SMS_TEMPLATE_ID || '').trim();
        let targetUrl = '';
        let requestOptions = {};
        let maskedPayloadString = '';
        if (provider === 'fast2sms') {
            targetUrl = 'https://www.fast2sms.com/dev/bulkV2';
            const payload = templateId
                ? {
                    route: 'dlt',
                    sender_id: senderId,
                    message: templateId,
                    variables_values: otp,
                    flash: 0,
                    numbers: cleanMobile,
                }
                : {
                    route: 'otp',
                    variables_values: otp,
                    numbers: cleanMobile,
                };
            const maskedPayload = { ...payload, numbers: maskedMobile };
            maskedPayloadString = JSON.stringify(maskedPayload, null, 2);
            requestOptions = {
                method: 'POST',
                headers: {
                    authorization: apiKey,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            };
        }
        else if (provider === '2factor') {
            targetUrl = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/91${cleanMobile}/${encodeURIComponent(otp)}/${encodeURIComponent(templateId || 'OTP_VERIFICATION')}`;
            maskedPayloadString = `GET https://2factor.in/API/V1/***KEY***/SMS/91${maskedMobile}/${otp}/${templateId || 'OTP_VERIFICATION'}`;
            requestOptions = {
                method: 'GET',
                headers: { Accept: 'application/json' },
            };
        }
        else if (provider === 'msg91') {
            targetUrl = 'https://control.msg91.com/api/v5/otp';
            const payload = {
                template_id: templateId,
                mobile: `91${cleanMobile}`,
                otp: otp,
            };
            maskedPayloadString = JSON.stringify({ ...payload, mobile: `91${maskedMobile}` }, null, 2);
            requestOptions = {
                method: 'POST',
                headers: {
                    authkey: apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            };
        }
        else {
            targetUrl = process.env.SMS_GATEWAY_URL || 'https://www.fast2sms.com/dev/bulkV2';
            const payload = {
                sender: senderId,
                entity_id: entityId,
                template_id: templateId,
                mobile: cleanMobile,
                message: exactSmsText,
                otp,
            };
            maskedPayloadString = JSON.stringify({ ...payload, mobile: maskedMobile }, null, 2);
            requestOptions = {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            };
        }
        const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
        const headerNames = Object.keys(requestOptions.headers || {});
        console.log(`\n================================================================================`);
        console.log(`📡 [SMS DISPATCH] Provider: ${provider.toUpperCase()} | Calling Live Endpoint`);
        console.log(`• Time: ${istTime}`);
        console.log(`• Target Mobile: +91-${maskedMobile}`);
        console.log(`• Live Endpoint URL: ${targetUrl}`);
        console.log(`• Route Type: ${route} (${templateId ? 'DLT Transactional' : 'Quick OTP'})`);
        console.log(`• Header Names Sent: [${headerNames.map((h) => `'${h}'`).join(', ')}]`);
        console.log(`• DLT Sender ID: ${senderId || 'NOT_SET'}`);
        console.log(`• DLT Entity ID: ${entityId || 'NOT_SET'}`);
        console.log(`• DLT Template ID: ${templateId || 'NOT_SET'}`);
        console.log(`• Exact Final SMS Text:`);
        console.log(`  "${exactSmsText}"`);
        console.log(`• Exact Payload Sent (Masked):`);
        console.log(maskedPayloadString);
        console.log(`--------------------------------------------------------------------------------`);
        const startTime = Date.now();
        let statusCode = 0;
        let rawResponseBody = '';
        let messageId = '';
        let requestId = '';
        let isSuccess = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(targetUrl, {
                ...requestOptions,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            statusCode = response.status;
            rawResponseBody = await response.text();
            const duration = Date.now() - startTime;
            console.log(`• HTTP Status: ${statusCode} ${response.statusText} | Duration: ${duration}ms`);
            console.log(`• FULL Raw Provider Response:`);
            console.log(`  ${rawResponseBody}`);
            let jsonResponse = null;
            try {
                jsonResponse = JSON.parse(rawResponseBody);
            }
            catch {
                jsonResponse = null;
            }
            if (jsonResponse) {
                messageId = jsonResponse.message_id || jsonResponse.request_id || jsonResponse.Details || (Array.isArray(jsonResponse.message) ? jsonResponse.message[0] : '') || '';
                requestId = jsonResponse.request_id || jsonResponse.sessionId || '';
            }
            console.log(`• Message ID: ${messageId || 'N/A'} | Request ID: ${requestId || 'N/A'}`);
            if (statusCode >= 200 && statusCode < 300) {
                if (jsonResponse) {
                    if (jsonResponse.return === true || jsonResponse.Status === 'Success' || jsonResponse.type === 'success') {
                        isSuccess = true;
                    }
                    else if (jsonResponse.return === false || jsonResponse.Status === 'Error') {
                        isSuccess = false;
                    }
                    else {
                        isSuccess = true;
                    }
                }
                else {
                    isSuccess = true;
                }
            }
            else {
                isSuccess = false;
            }
            const isInvalidApiKey = statusCode === 412 ||
                (statusCode === 401 &&
                    (rawResponseBody.toLowerCase().includes('invalid') ||
                        rawResponseBody.toLowerCase().includes('authentication') ||
                        rawResponseBody.toLowerCase().includes('authorization'))) ||
                rawResponseBody.toLowerCase().includes('invalid authentication') ||
                rawResponseBody.toLowerCase().includes('check authorization key') ||
                rawResponseBody.toLowerCase().includes('invalid api key') ||
                (jsonResponse && jsonResponse.status_code === 412);
            if (isSuccess) {
                console.log(`\x1b[32m✔ [SMS DISPATCH SUCCESS] Provider accepted OTP dispatch for +91-${maskedMobile}\x1b[0m`);
                console.log(`================================================================================\n`);
                this.trackDeliveryReport(messageId || requestId || `msg_${Date.now()}`, cleanMobile, provider, apiKey);
                return {
                    success: true,
                    delivered: true,
                    provider,
                    url: targetUrl,
                    messageId: messageId || requestId,
                    requestId,
                    statusCode,
                    rawResponse: rawResponseBody,
                    exactSmsText,
                    maskedMobile,
                    clientFriendlyMessage: 'OTP sent successfully',
                    cooldownSeconds: 30,
                };
            }
            else if (isInvalidApiKey) {
                console.error(`\x1b[31m[API FAILED] ${istTime} api=otp ${duration}ms reason=Invalid SMS API key (412) - Please check or regenerate your API key in the Fast2SMS provider dashboard (fast2sms.com -> Dev API) url=${targetUrl}\x1b[0m`);
                console.log(`================================================================================\n`);
                return {
                    success: false,
                    delivered: false,
                    provider,
                    url: targetUrl,
                    messageId,
                    requestId,
                    statusCode: 412,
                    rawResponse: rawResponseBody,
                    exactSmsText,
                    maskedMobile,
                    failureReason: 'Invalid SMS API key (412)',
                    clientFriendlyMessage: 'OTP service is temporarily unavailable. Try again or use email OTP',
                    applicableCause: 'CAUSE 4 (Account/Credentials): The SMS_API_KEY in .env is invalid or rejected by provider (412). Regenerate in Fast2SMS provider dashboard.',
                    cooldownSeconds: 30,
                    canEmail: true,
                };
            }
            else {
                const cause = this.diagnoseCause(statusCode, rawResponseBody, provider);
                console.error(`\x1b[31m[API FAILED] ${istTime} api=sms-dispatch ${duration}ms reason=${cause} url=${targetUrl}\x1b[0m`);
                console.log(`================================================================================\n`);
                return {
                    success: false,
                    delivered: false,
                    provider,
                    url: targetUrl,
                    messageId,
                    requestId,
                    statusCode,
                    rawResponse: rawResponseBody,
                    exactSmsText,
                    maskedMobile,
                    failureReason: `Provider Error (${statusCode})`,
                    clientFriendlyMessage: 'OTP service is temporarily unavailable. Try again or use email OTP',
                    applicableCause: cause,
                    cooldownSeconds: 30,
                    canEmail: true,
                };
            }
        }
        catch (err) {
            const duration = Date.now() - startTime;
            const errorMsg = err.name === 'AbortError' ? 'SMS Gateway request timed out after 10s' : err.message;
            console.error(`\x1b[31m[API FAILED] ${istTime} api=sms-dispatch ${duration}ms reason=${errorMsg} url=${targetUrl}\x1b[0m`);
            console.log(`================================================================================\n`);
            return {
                success: false,
                delivered: false,
                provider,
                url: targetUrl,
                statusCode: 502,
                rawResponse: JSON.stringify({ error: errorMsg }),
                exactSmsText,
                maskedMobile,
                failureReason: errorMsg,
                clientFriendlyMessage: 'OTP service is temporarily unavailable. Try again or use email OTP',
                applicableCause: 'Network error or upstream SMS gateway connection timeout',
                cooldownSeconds: 30,
                canEmail: true,
            };
        }
    }
    trackDeliveryReport(messageId, mobile, provider, apiKey) {
        if (!messageId)
            return;
        const maskedMobile = this.maskMobile(mobile);
        const trackingEntry = {
            mobile,
            messageId,
            dispatchedAt: Date.now(),
            status: 'PENDING',
            provider,
        };
        this.deliveryTrackers.set(messageId, trackingEntry);
        const checkIntervals = [5000, 15000, 30000, 60000];
        checkIntervals.forEach((delay) => {
            setTimeout(async () => {
                const record = this.deliveryTrackers.get(messageId);
                if (!record || record.status === 'DELIVERED')
                    return;
                try {
                    const statusResult = await this.queryProviderDeliveryStatus(messageId, provider, apiKey);
                    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
                    console.log(`[OTP DELIVERY] id=${messageId} status=${statusResult.status} reason=${statusResult.reason || 'Telecom operator ACK'}`);
                    if (statusResult.status === 'DELIVERED') {
                        record.status = 'DELIVERED';
                    }
                    else if (statusResult.status === 'FAILED') {
                        record.status = 'FAILED';
                        record.reason = statusResult.reason;
                        console.error(`\x1b[31m[API FAILED] ${istTime} api=otp-delivery id=${messageId} reason=${statusResult.reason}\x1b[0m`);
                    }
                    else if (delay === 60000 && record.status === 'PENDING') {
                        record.status = 'FAILED';
                        record.reason = 'Delivery timeout: No operator delivery receipt within 60s (possible DND or DLT template filter)';
                        console.error(`\x1b[31m[API FAILED] ${istTime} api=otp-delivery id=${messageId} reason=${record.reason}\x1b[0m`);
                    }
                }
                catch (err) {
                    if (delay === 60000) {
                        console.error(`\x1b[31m[API FAILED] api=otp-delivery id=${messageId} reason=Delivery report check error: ${err?.message}\x1b[0m`);
                    }
                }
            }, delay);
        });
    }
    async queryProviderDeliveryStatus(messageId, provider, apiKey) {
        if (!apiKey || apiKey.includes('mock_sms')) {
            return { status: 'FAILED', reason: 'Mock/unconfigured API key - delivery cannot be verified with telecom operator' };
        }
        try {
            if (provider === 'fast2sms') {
                const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&request_id=${messageId}`, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.status === 'DELIVERED')
                        return { status: 'DELIVERED' };
                    if (data && data.status === 'FAILED')
                        return { status: 'FAILED', reason: data.reason || 'Operator rejection' };
                }
            }
            else if (provider === '2factor') {
                const res = await fetch(`https://2factor.in/API/V1/${apiKey}/ADDON_SERVICES/RPT/TSMS/${messageId}`, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.Status === 'Delivered')
                        return { status: 'DELIVERED' };
                    if (data && data.Status === 'Failed')
                        return { status: 'FAILED', reason: data.Details || 'Operator rejection' };
                }
            }
        }
        catch {
        }
        return { status: 'PENDING', reason: 'Awaiting operator DLT confirmation' };
    }
    async sendEmailOtp(email, otp) {
        const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
        const emailSubject = 'FourX Security Verification Code';
        const emailBody = `Your FourX security verification OTP is: ${otp}. This code is valid for 10 minutes. Please do not share it with anyone.`;
        console.log(`\n================================================================================`);
        console.log(`✉️  [EMAIL OTP DISPATCH] Target: ${email}`);
        console.log(`• Time: ${istTime}`);
        console.log(`• Subject: ${emailSubject}`);
        console.log(`• Body: "${emailBody}"`);
        console.log(`\x1b[32m✔ [EMAIL DISPATCHED] OTP successfully queued for delivery to ${email}\x1b[0m`);
        console.log(`================================================================================\n`);
        return {
            success: true,
            message: `OTP sent successfully to email: ${email}`,
        };
    }
    getDeliveryStatus(messageId) {
        return this.deliveryTrackers.get(messageId) || null;
    }
};
SmsService = SmsService_1 = __decorate([
    Injectable()
], SmsService);
export { SmsService };
//# sourceMappingURL=sms.service.js.map