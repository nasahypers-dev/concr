import { z } from 'zod';
import { phoneE164Schema } from './common';

export const OTP_CODE_LENGTH = 6;

export const otpRequestSchema = z.object({
  phone: phoneE164Schema,
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneE164Schema,
  code: z.string().regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), { error: 'INVALID_OTP_FORMAT' }),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const staffLoginSchema = z.object({
  email: z.email({ error: 'INVALID_EMAIL' }),
  password: z.string().min(8, { error: 'PASSWORD_TOO_SHORT' }).max(128),
});
export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
