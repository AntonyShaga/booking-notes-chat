"use client";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { mutate, isLoading, error } = trpc.twoFA.enable2FA.useMutation({
    onSuccess(data) {
      setQrCode(data.qrCode);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  console.log("sdfsd");
  return (
    <div>
      <button
        onClick={() => mutate()}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isLoading ? "Генерация..." : "Включить 2FA"}
      </button>

      {qrCode && (
        <div className="mt-4">
          <p className="mb-2">Отсканируй в Google Authenticator:</p>
          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error.message}</p>}
    </div>
  );
}
