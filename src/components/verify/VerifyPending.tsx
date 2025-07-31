"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerifyPending() {
  const router = useRouter();
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const { data: emailStatus, refetch: refetchEmailStatus } =
    trpc.getEmailStatus.getEmailStatus.useQuery(undefined, {
      refetchInterval: 3000,
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

  useEffect(() => {
    if (emailStatus?.verified) {
      toast.success("Email успешно подтвержден!");
      router.push("/");
    }
  }, [emailStatus, router]);

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
    resend();
    refetchEmailStatus();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-2xl font-bold mb-2">Подтвердите вашу почту</h1>
      <p className="mb-4">Мы отправили письмо на вашу почту.</p>
      <Button
        onClick={handleResend}
        disabled={isLoading || cooldownLeft > 0}
        className="px-4 py-2 rounded disabled:opacity-50"
      >
        {cooldownLeft > 0 ? `Повторно через ${cooldownLeft}с` : "Отправить повторно"}
      </Button>
    </div>
  );
}
