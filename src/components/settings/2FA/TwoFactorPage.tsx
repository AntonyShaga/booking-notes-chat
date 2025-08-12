"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import MethodSelector from "@/components/settings/2FA/enable2FA/MethodSelector";
import CodeVerificationSection from "@/components/settings/2FA/enable2FA/CodeVerificationSection";
import { Button } from "@/components/ui/button";

type TwoFAMethod = "qr" | "manual" | "email";

export default function TwoFactorPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [method, setMethod] = useState<TwoFAMethod>("qr");
  const [code, setCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedId = sessionStorage.getItem("2fa_user_id");
    if (!storedId) {
      toast.error("2FA session is invalid. Please try again.");
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
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const enable = trpc.twoFA.request2FA.useMutation({
    onSuccess(data) {
      if (data.method === "email") toast.success("Code sent to email");
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <div className="flex w-1/4 flex-col container mx-auto items-center justify-center min-h-screen px-4">
      <MethodSelector method={method} setMethod={setMethod} />
      <Button
        onClick={() => {
          if (!userId) {
            toast.error("No userId - unable to send code");
            return;
          }
          enable.mutate({ userId, method });
        }}
        className="w-full py-2 rounded mb-4"
        disabled={enable.isLoading}
      >
        {enable.isLoading ? "Generating..." : "Get code"}
      </Button>

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
