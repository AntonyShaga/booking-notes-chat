import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Пожалуйста, введите корректный адрес электронной почты."),
  password: z
    .string()
    .min(6, "Пароль должен содержать как минимум 6 символов.")
    .max(128, "Пароль не может быть длиннее 128 символов."),
});
export const verify2FAAfterLoginSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6, { message: "Код должен содержать 6 символов" }),
  method: z.enum(["qr", "manual", "email"]),
});
