import { OnModuleInit } from '@nestjs/common';
export interface SmsSendResult {
    success: boolean;
    delivered: boolean;
    provider: string;
    url: string;
    messageId?: string;
    requestId?: string;
    statusCode: number;
    rawResponse: string;
    exactSmsText: string;
    maskedMobile: string;
    failureReason?: string;
    clientFriendlyMessage?: string;
    applicableCause?: string;
    cooldownSeconds?: number;
    canEmail?: boolean;
}
export declare class SmsService implements OnModuleInit {
    private readonly logger;
    onModuleInit(): void;
    auditSmsConfig(): void;
    getSanitizedApiKey(): string;
    private readonly rateLimits;
    private readonly deliveryTrackers;
    maskMobile(mobile: string): string;
    validateMobile(mobile: string): string;
    checkRateLimit(cleanMobile: string): {
        allowed: boolean;
        reason?: string;
        cooldownSeconds?: number;
    };
    formatSmsText(otp: string): string;
    diagnoseCause(statusCode: number, rawBody: string, provider: string): string;
    sendOtp(mobile: string, otp: string): Promise<SmsSendResult>;
    private trackDeliveryReport;
    private queryProviderDeliveryStatus;
    sendEmailOtp(email: string, otp: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getDeliveryStatus(messageId: string): {
        mobile: string;
        messageId: string;
        dispatchedAt: number;
        status: "PENDING" | "DELIVERED" | "FAILED";
        reason?: string;
        provider: string;
    } | null;
}
