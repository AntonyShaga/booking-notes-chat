"use client";
import { trpc } from "@/utils/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

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
  const copyToClipboard = () => {
    if (manualSecret) {
      navigator.clipboard.writeText(manualSecret);
      toast.success("Секрет скопирован в буфер обмена");
    }
  };

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
        {(method === "qr" || qrCode) && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-4 mb-4"
          >
            <p className="mb-2">Отсканируйте QR-код в приложении:</p>
            {qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto border rounded" />
            ) : (
              <div className="w-48 h-48 mx-auto border rounded bg-gray-100 animate-pulse" />
            )}
          </motion.div>
        )}

        {(method === "manual" || manualSecret) && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-4 mb-4"
          >
            <p className="mb-2">Введите этот секрет вручную:</p>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 p-2 block rounded break-all flex-1">
                {manualSecret || "••••••••••••••••••••••••••••"}
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
          </motion.div>
        )}

        {(method === "email" || qrCode || manualSecret) && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
