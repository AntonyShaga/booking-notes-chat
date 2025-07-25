"use client";
import { trpc } from "@/utils/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import VerificationSection from "@/components/settings/2FA/enable2FA/VerificationSection";
import MethodSelector from "@/components/settings/2FA/enable2FA/MethodSelector";
import { TwoFAMethod } from "@/shared/types/twoFAMethod";
import { Button } from "@/components/ui/button";

export default function Enable2FA({ onSuccess }: { onSuccess: () => void }) {
  const [method, setMethod] = useState<TwoFAMethod>("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    setQrCode(null);
    setManualSecret(null);
    setCode("");
  }, [method]);

  const enable = trpc.twoFA.enable2FA.useMutation({
    onSuccess(data) {
      if (data.method === "qr") setQrCode(data.qrCode);
      if (data.method === "manual") setManualSecret(data.secret);
      if (data.method === "email") toast.success("Код отправлен на email");
    },
    onError: (err) => toast.error(err.message),
  });
  const confirm = trpc.twoFA.confirm2FASetup.useMutation({
    onSuccess() {
      toast.success("2FA успешно включена!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });
  return (
    <div className={"flex flex-col justify-center"}>
      <div>
        <MethodSelector method={method} setMethod={setMethod} />
        <Button
          onClick={() => enable.mutate({ method })}
          disabled={enable.isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded mb-4"
        >
          {enable.isLoading ? "Генерация..." : "Получить код"}
        </Button>
      </div>

      <VerificationSection
        method={method}
        qrCode={qrCode}
        manualSecret={manualSecret}
        code={code}
        setCode={setCode}
        isLoading={confirm.isLoading}
        onConfirm={() => confirm.mutate({ code, method })}
      />
    </div>
  );
}
