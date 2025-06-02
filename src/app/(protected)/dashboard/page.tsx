"use client";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Enable2FA() {
  const [method, setMethod] = useState<"qr" | "manual" | "email" | "sms">("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");

  // Запрос на включение 2FA
  const enableMutation = trpc.twoFA.enable2FA.useMutation({
    onSuccess(data) {
      setQrCode(data.qrCode ?? null);
      setManualSecret(data.secret ?? null);

      if (method === "email" || method === "sms") {
        toast.success(method === "email" ? "Код отправлен на email" : "Код отправлен в SMS");
      }
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  // Подтверждение кода
  const confirmMutation = trpc.twoFA.confirm2FASetup.useMutation({
    onSuccess() {
      toast.success("2FA успешно включено!");
      setQrCode(null);
      setManualSecret(null);
      setCode("");
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const handleEnable = () => {
    enableMutation.mutate({ method });
  };

  const handleConfirm = () => {
    confirmMutation.mutate({ code });
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Включение двухфакторной аутентификации</h2>

      {/* Выбор метода */}
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as any)}
        className="border p-2 rounded mb-4 w-full"
      >
        <option value="qr">QR-код (рекомендуется)</option>
        <option value="manual">Ручной ввод секрета</option>
        <option value="email">Код на email</option>
        <option value="sms">Код в SMS</option>
      </select>

      <button
        onClick={handleEnable}
        disabled={enableMutation.isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded w-full"
      >
        {enableMutation.isLoading ? "Генерация..." : "Получить код"}
      </button>

      {/* QR или manual secret */}
      {qrCode && (
        <div className="mt-4">
          <p className="mb-2">Отсканируй QR-код в Google Authenticator:</p>
          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
        </div>
      )}
      {manualSecret && (
        <div className="mt-4">
          <p className="mb-2">Введи этот секрет вручную:</p>
          <code className="bg-gray-100 p-2 rounded inline-block font-mono">{manualSecret}</code>
        </div>
      )}

      {/* Подтверждение кода */}
      {(qrCode || manualSecret || method === "email" || method === "sms") && (
        <div className="mt-6">
          <label className="block mb-1 font-medium">Введите 6-значный код</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            placeholder="Напр. 123456"
            className="border p-2 rounded w-full"
          />

          <button
            onClick={handleConfirm}
            disabled={confirmMutation.isLoading || code.length !== 6}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded w-full"
          >
            {confirmMutation.isLoading ? "Проверка..." : "Подтвердить"}
          </button>
        </div>
      )}
    </div>
  );
}
