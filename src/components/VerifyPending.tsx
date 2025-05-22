"use client";

import { trpc } from "@/utils/trpc";

export default function VerifyPending() {
  const { mutate: resend, isLoading } = trpc.verifyEmail.resendVerificationEmail.useMutation();
  const refreshToken = trpc.refreshToken.refreshToken.useMutation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-2xl font-bold mb-2">Подтвердите вашу почту</h1>
      <p className="mb-4">Мы отправили письмо на вашу почту.</p>
      <button
        onClick={() => {
          refreshToken.mutate(); // Сначала обновляем токен
          resend(); // Потом отправляем письмо
        }}
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Отправить повторно
      </button>
    </div>
  );
}
