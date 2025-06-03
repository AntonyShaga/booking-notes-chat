import { authenticator } from "otplib";
import qrcode from "qrcode";

export const generateOTPSecret = () => authenticator.generateSecret();

export const generateQRCode = async (email: string, appName: string, secret: string) => {
  const otpauth = authenticator.keyuri(email, appName, secret);
  const qrCode = await qrcode.toDataURL(otpauth);
  return { otpauth, qrCode };
};

export const generateEmailToken = (secret: string) => {
  return authenticator.generate(secret);
};
