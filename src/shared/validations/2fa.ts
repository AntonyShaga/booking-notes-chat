import { z } from "zod";

export const enable2FASchema = z.object({
  method: z.enum(["qr", "manual", "email"]),
});

export const confirm2FASchema = z.object({
  code: z.string().length(6).regex(/^\d+$/, "Код должен содержать только цифры"),
  method: z.enum(["qr", "manual", "email"]),
});

export const request2FASchema = z.object({
  userId: z.string(),
  method: z.enum(["qr", "manual", "email"]),
});

export const TwoFAOutputSchema = z.union([
  z.object({ method: z.literal("qr"), message: z.string() }),
  z.object({ method: z.literal("manual"), message: z.string() }),
  z.object({ method: z.literal("email") }),
]);

export type TwoFAOutput = z.infer<typeof TwoFAOutputSchema>;

export const enable2FAResponseSchema = z.union([
  z.object({ method: z.literal("qr"), qrCode: z.string() }),
  z.object({ method: z.literal("manual"), secret: z.string() }),
  z.object({ method: z.literal("email") }),
]);

export type Enable2FAResponse = z.infer<typeof enable2FAResponseSchema>;
