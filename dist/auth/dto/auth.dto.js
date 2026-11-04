var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';
export class RegisterDto {
    fullName;
    email;
    mobile;
    password;
    confirmPassword;
}
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Full name is required' }),
    MinLength(2, { message: 'Full name must be at least 2 characters' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    IsEmail({}, { message: 'Please provide a valid email address' }),
    IsNotEmpty({ message: 'Email address is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Mobile number is required' }),
    Matches(/^[6-9]\d{9}$/, {
        message: 'Mobile must be a valid 10-digit Indian mobile number (e.g. 9876543210)',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "mobile", void 0);
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Password is required' }),
    MinLength(8, { message: 'Password must be at least 8 characters long' }),
    Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
        message: 'Password must contain at least one letter, one number, and one symbol',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Confirm password is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "confirmPassword", void 0);
export class LoginDto {
    identifier;
    password;
}
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Email or mobile number is required' }),
    __metadata("design:type", String)
], LoginDto.prototype, "identifier", void 0);
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Password is required' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
export class SendOtpDto {
    mobile;
}
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Mobile number is required' }),
    Matches(/^[6-9]\d{9}$/, {
        message: 'Mobile must be a valid 10-digit Indian mobile number',
    }),
    __metadata("design:type", String)
], SendOtpDto.prototype, "mobile", void 0);
export class SendEmailOtpDto {
    email;
    mobile;
}
__decorate([
    IsEmail({}, { message: 'Valid email address is required' }),
    IsNotEmpty({ message: 'Email address is required' }),
    __metadata("design:type", String)
], SendEmailOtpDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], SendEmailOtpDto.prototype, "mobile", void 0);
export class VerifyOtpDto {
    mobile;
    email;
    otp;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "mobile", void 0);
__decorate([
    IsOptional(),
    IsEmail({}, { message: 'Must be a valid email address' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "email", void 0);
__decorate([
    IsString(),
    IsNotEmpty({ message: 'OTP is required' }),
    Length(6, 6, { message: 'OTP must be exactly 6 digits' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);
export class ForgotPasswordDto {
    email;
}
__decorate([
    IsEmail({}, { message: 'Please provide a valid email address' }),
    IsNotEmpty({ message: 'Email address is required' }),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
export class ResetPasswordDto {
    token;
    newPassword;
}
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Reset token is required' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    IsString(),
    IsNotEmpty({ message: 'New password is required' }),
    MinLength(8, { message: 'Password must be at least 8 characters long' }),
    Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
        message: 'Password must contain at least one letter, one number, and one symbol',
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
//# sourceMappingURL=auth.dto.js.map