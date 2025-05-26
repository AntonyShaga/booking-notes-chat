"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function VerifyPending() {
  const router = useRouter();
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Добавляем запрос для проверки статуса email
  const { data: emailStatus, refetch: refetchEmailStatus } =
    trpc.getEmailStatus.getEmailStatus.useQuery(undefined, {
      refetchInterval: 5000, // Проверяем каждые 5 секунд
    });

  const { mutate: resend, isLoading } = trpc.verifyEmail.resendVerificationEmail.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setLastSentAt(Date.now());
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const refreshToken = trpc.refreshToken.refreshToken.useMutation();

  // Если email верифицирован, перенаправляем пользователя
  useEffect(() => {
    if (emailStatus?.verified) {
      toast.success("Email успешно подтвержден!");
      router.push("/"); // или на другую страницу
    }
  }, [emailStatus, router]);

  // Обновляем оставшийся кулдаун каждую секунду
  useEffect(() => {
    if (!lastSentAt) return;

    const interval = setInterval(() => {
      const secondsPassed = Math.floor((Date.now() - lastSentAt) / 1000);
      const secondsLeft = Math.max(30 - secondsPassed, 0);
      setCooldownLeft(secondsLeft);

      if (secondsLeft === 0) {
        clearInterval(interval);
        setLastSentAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSentAt]);

  const handleResend = () => {
    refreshToken.mutate(undefined, {
      onSuccess: () => {
        resend();
        // После повторной отправки обновляем статус email
        refetchEmailStatus();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-2xl font-bold mb-2">Подтвердите вашу почту</h1>
      <p className="mb-4">Мы отправили письмо на вашу почту.</p>
      <button
        onClick={handleResend}
        disabled={isLoading || cooldownLeft > 0}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {cooldownLeft > 0 ? `Повторно через ${cooldownLeft}с` : "Отправить повторно"}
      </button>
    </div>
  );
}
