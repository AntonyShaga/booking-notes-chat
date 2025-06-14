"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import MethodSelector from "@/components/settings/2FA/enable2FA/MethodSelector";
import Button from "@/components/ui/Button";
import CodeVerificationSection from "@/components/settings/2FA/enable2FA/CodeVerificationSection";
type TwoFAMethod = "qr" | "manual" | "email";
export default function TwoFactorPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [method, setMethod] = useState<TwoFAMethod>("qr");
  const [code, setCode] = useState("");
  const router = useRouter();

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
      toast.success(data?.message);
      sessionStorage.removeItem("2fa_user_id");
      window.location.href = "/";
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  /* const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    verify2FA.mutate({ userId, code, method });
  };
*/
  const enable = trpc.twoFA.request2FA.useMutation({
    onSuccess(data) {
      if (data.method === "email") toast.success("Код отправлен на email");
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <MethodSelector method={method} setMethod={setMethod} />
      <Button
        onClick={() => {
          if (!userId) {
            toast.error("Нет userId — невозможно отправить код");
            return;
          }
          enable.mutate({ userId, method });
        }}
        className="w-full bg-blue-600 text-white py-2 rounded mb-4"
        disabled={enable.isLoading}
      >
        {enable.isLoading ? "Генерация..." : "Получить код"}
      </Button>

      {/*<form onSubmit={handleSubmit} className="max-w-sm w-full space-y-4">
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
      </form>*/}
      <CodeVerificationSection
        key={`code-verification-${method}`}
        code={code}
        setCode={setCode}
        isLoading={verify2FA.isLoading}
        onConfirm={() => {
          if (!userId) return;
          verify2FA.mutate({ userId, code, method });
        }}
      />
    </div>
  );
}
