"use client";
import { trpc } from "@/utils/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import ManualSecretSection from "@/components/settings/2FA/enable2FA/ManualSecretSection";
import QRCodeSection from "@/components/settings/2FA/enable2FA/QRCodeSection";
import CodeVerificationSection from "@/components/settings/2FA/enable2FA/CodeVerificationSection";

type TwoFAMethod = "qr" | "manual" | "email";

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
    <div>
      <select
        className="w-full border rounded p-2 mb-4"
        value={method}
        onChange={(e) => setMethod(e.target.value as TwoFAMethod)}
      >
        <option value="qr">QR-код</option>
        <option value="manual">Ручной ввод</option>
        <option value="email">Код на Email</option>
      </select>

      <button
        onClick={() => enable.mutate({ method })}
        className="w-full bg-blue-600 text-white py-2 rounded mb-4"
        disabled={enable.isLoading}
      >
        {enable.isLoading ? "Генерация..." : "Получить код"}
      </button>

      <AnimatePresence mode="wait">
        {(method === "qr" || qrCode) && <QRCodeSection qrCode={qrCode} key="qr-code-section" />}
        {(method === "manual" || manualSecret) && (
          <ManualSecretSection secret={manualSecret} key="manual-secret-section" />
        )}
        {(method === "email" || qrCode || manualSecret) && (
          <CodeVerificationSection
            key={`code-verification-${method}`}
            code={code}
            setCode={setCode}
            isLoading={confirm.isLoading}
            onConfirm={() => confirm.mutate({ code, method })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
