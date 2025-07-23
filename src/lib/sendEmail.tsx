import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import { VerifyEmail } from "@/components/VerifyEmail";

export async function sendEmail({
  to,
  subject,
  token,
}: {
  to: string;
  subject: string;
  token: string;
}) {
  try {
    const html = await render(
      <VerifyEmail
        email={to}
        url={`${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`}
      />
    );
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
