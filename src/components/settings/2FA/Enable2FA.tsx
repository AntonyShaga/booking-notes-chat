"use client";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { toast } from "sonner";

type TwoFAMethod = "qr" | "manual" | "email";

export default function Enable2FA({ onSuccess }: { onSuccess: () => void }) {
  const [method, setMethod] = useState<TwoFAMethod>("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");

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
      <select value={method} onChange={(e) => setMethod(e.target.value as TwoFAMethod)}>
        <option value="qr">QR</option>
        <option value="manual">Manual</option>
        <option value="email">Email</option>
      </select>

      <button onClick={() => enable.mutate({ method })}>Получить код</button>

      {qrCode && <img src={qrCode} alt="qr" />}
      {manualSecret && <code>{manualSecret}</code>}

      {(qrCode || manualSecret || method === "email") && (
        <>
          <input value={code} onChange={(e) => setCode(e.target.value)} />
          <button onClick={() => confirm.mutate({ code, method })} disabled={code.length !== 6}>
            Подтвердить
          </button>
        </>
      )}
    </div>
  );
}
