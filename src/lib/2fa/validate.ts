import { authenticator } from "otplib";

export const validateOTPCode = (token: string, secret: string): boolean => {
  return authenticator.check(token, secret);
};
