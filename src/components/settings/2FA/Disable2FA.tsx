"use client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export default function Disable2FA({ onSuccess }: { onSuccess: () => void }) {
  const disable = trpc.twoFA.disable2FA.useMutation({
    onSuccess: () => {
      toast.success("2FA отключена");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="text-center py-4">
      <p className="text-green-600 mb-4">2FA включена</p>
      <button
        onClick={() => disable.mutate()}
        disabled={disable.isLoading}
        className="w-full bg-red-600 text-white py-2 rounded"
      >
        {disable.isLoading ? "Отключение..." : "Отключить 2FA"}
      </button>
    </div>
  );
}
