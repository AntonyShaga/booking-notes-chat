// lib/sendEmail.ts
import { resend } from "@/lib/resend";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await resend.emails.send({
      from: "no-reply@resend.dev",
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Отправлено: ${to}`);
  } catch (error) {
    console.error("[EMAIL] Ошибка при отправке:", error);
    throw new Error("Не удалось отправить письмо");
  }
}
