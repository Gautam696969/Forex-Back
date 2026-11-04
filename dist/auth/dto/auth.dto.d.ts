export declare class RegisterDto {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
    confirmPassword: string;
}
export declare class LoginDto {
    identifier: string;
    password: string;
}
export declare class SendOtpDto {
    mobile: string;
}
export declare class SendEmailOtpDto {
    email: string;
    mobile?: string;
}
export declare class VerifyOtpDto {
    mobile?: string;
    email?: string;
    otp: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
