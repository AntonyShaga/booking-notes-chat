"use client";
import { trpc } from "@/utils/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type TwoFAMethod = "qr" | "manual" | "email";

export default function Settings() {
  const [method, setMethod] = useState<TwoFAMethod>("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  const { data: status, refetch } = trpc.twoFA.get2FAStatus.useQuery();

  useEffect(() => {
    if (status?.isEnabled) setIsEnabled(true);
  }, [status]);

  const enable = trpc.twoFA.enable2FA.useMutation({
    onSuccess(data) {
      if (data.method === "qr") setQrCode(data.qrCode);
      if (data.method === "manual") setManualSecret(data.secret);
      if (data.method === "email") toast.success("Код отправлен на email");
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const confirm = trpc.twoFA.confirm2FASetup.useMutation({
    onSuccess() {
      toast.success("2FA успешно включена11!");
      resetState();
      setIsEnabled(true);
      refetch();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const disable = trpc.twoFA.disable2FA.useMutation({
    onSuccess() {
      toast.success("2FA успешно отключена!");
      setIsEnabled(false);
      refetch();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const resetState = () => {
    setQrCode(null);
    setManualSecret(null);
    setCode("");
  };

  const copyToClipboard = () => {
    if (manualSecret) {
      navigator.clipboard.writeText(manualSecret);
      toast.success("Секрет скопирован в буфер обмена");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{isEnabled ? "2FA включена" : "Включить 2FA"}</h2>

      {!isEnabled ? (
        <>
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

          {qrCode && (
            <div className="mt-4 mb-4">
              <p className="mb-2">Отсканируйте QR-код в приложении:</p>
              <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto border rounded" />
            </div>
          )}

          {manualSecret && (
            <div className="mt-4 mb-4">
              <p className="mb-2">Введите этот секрет вручную:</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 p-2 block rounded break-all flex-1">
                  {manualSecret}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                  title="Копировать"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {(qrCode || manualSecret || method === "email") && (
            <div className="mt-6">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-значный код"
                maxLength={6}
                className="w-full border rounded p-2 mb-2"
              />
              <button
                onClick={() => confirm.mutate({ code, method })}
                disabled={confirm.isLoading || code.length !== 6}
                className="w-full bg-green-600 text-white py-2 rounded"
              >
                {confirm.isLoading ? "Проверка..." : "Подтвердить"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-green-600 mb-4">Двухфакторная аутентификация активна</p>
          <button
            onClick={() => disable.mutate()}
            className="w-full bg-red-600 text-white py-2 rounded"
            disabled={disable.isLoading}
          >
            {disable.isLoading ? "Отключение..." : "Отключить 2FA"}
          </button>
        </div>
      )}
    </div>
  );
}
