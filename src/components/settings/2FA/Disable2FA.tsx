"use client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
      <p className="mb-4">2FA включена</p>
      <Button
        onClick={() => disable.mutate()}
        disabled={disable.isLoading}
        className="w-full  py-2 rounded"
      >
        {disable.isLoading ? "Отключение..." : "Отключить 2FA"}
      </Button>
    </div>
  );
}
