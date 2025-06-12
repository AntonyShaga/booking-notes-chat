"use client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import Button from "@/components/ui/Button";

export function LogoutButton() {
  const logOut = trpc.logout.logout.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      window.location.href = "/signup";
    },
  });

  return (
    <Button className="bg-inherit" onClick={() => logOut.mutate()}>
      Log Out
    </Button>
  );
}
