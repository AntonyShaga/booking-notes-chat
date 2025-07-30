"use client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const logOut = trpc.logout.logout.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      window.location.href = "/login";
    },
  });

  return (
    <Button className="bg-inherit" onClick={() => logOut.mutate()}>
      Log Out
    </Button>
  );
}
