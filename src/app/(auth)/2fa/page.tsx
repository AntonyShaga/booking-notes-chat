// app/2fa/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export default function TwoFactorPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const router = useRouter();

  // Чтение userId из sessionStorage
  useEffect(() => {
    const storedId = sessionStorage.getItem("2fa_user_id");
    if (!storedId) {
      toast.error("2FA сессия недействительна. Попробуйте снова.");
      router.push("/login");
    } else {
      setUserId(storedId);
    }
  }, []);

  const verify2FA = trpc.auth.verify2FAAfterLogin.useMutation({
    onSuccess: (data) => {
      toast.success("2FA подтверждена!");
      sessionStorage.removeItem("2fa_user_id");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    verify2FA.mutate({ userId, code });
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form onSubmit={handleSubmit} className="max-w-sm w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Двухфакторная аутентификация</h1>

        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="Введите 6-значный код"
        />

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={verify2FA.isLoading}
        >
          {verify2FA.isLoading ? "Проверка..." : "Подтвердить"}
        </button>
      </form>
    </div>
  );
}
