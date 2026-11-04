export declare class AppController {
    getRoot(): {
        status: string;
        service: string;
        version: string;
        market: string;
        timestampIST: string;
        endpoints: {
            indices: string;
            candles: string;
            auth: {
                register: string;
                login: string;
                me: string;
                sendOtp: string;
                verifyOtp: string;
                refresh: string;
                logout: string;
            };
            market: {
                pairs: string;
                quotes: string;
                status: string;
                ipos: string;
                mutualFunds: string;
                commodities: string;
            };
        };
    };
}
