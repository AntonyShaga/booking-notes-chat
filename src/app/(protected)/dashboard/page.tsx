"use client";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { toast } from "sonner";

type TwoFAMethod = "qr" | "manual" | "email";

export default function Enable2FA() {
  const [method, setMethod] = useState<TwoFAMethod>("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");

  const enable = trpc.twoFA.enable2FA.useMutation({
    onSuccess(data) {
      if (data.qrCode) setQrCode(data.qrCode);
      if (data.secret) setManualSecret(data.secret);
      if (data.method === "email") toast.success("Код отправлен на email");
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const confirm = trpc.twoFA.confirm2FASetup.useMutation({
    onSuccess() {
      toast.success("2FA включено!");
      setQrCode(null);
      setManualSecret(null);
      setCode("");
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Включить 2FA</h2>

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
        className="w-full bg-blue-600 text-white py-2 rounded"
        disabled={enable.isLoading}
      >
        {enable.isLoading ? "Отправка..." : "Получить код"}
      </button>

      {qrCode && (
        <div className="mt-4">
          <p>Сканируй в Google Authenticator:</p>
          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
        </div>
      )}

      {manualSecret && (
        <div className="mt-4">
          <p>Секрет для ручного ввода:</p>
          <code className="bg-gray-200 p-2 block rounded">{manualSecret}</code>
        </div>
      )}

      {(qrCode || manualSecret || method === "email") && (
        <div className="mt-6">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-значный код"
            maxLength={6}
            className="w-full border rounded p-2 mb-2"
          />
          <button
            onClick={() => confirm.mutate({ code })}
            disabled={confirm.isLoading || code.length !== 6}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            {confirm.isLoading ? "Проверка..." : "Подтвердить"}
          </button>
        </div>
      )}
    </div>
  );
}
