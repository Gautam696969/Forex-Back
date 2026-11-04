import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  fullName!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile must be a valid 10-digit Indian mobile number (e.g. 9876543210)',
  })
  mobile!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'Password must contain at least one letter, one number, and one symbol',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword!: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Email or mobile number is required' })
  identifier!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class SendOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile must be a valid 10-digit Indian mobile number',
  })
  mobile!: string;
}

export class SendEmailOtpDto {
  @IsEmail({}, { message: 'Valid email address is required' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'Password must contain at least one letter, one number, and one symbol',
  })
  newPassword!: string;
}

