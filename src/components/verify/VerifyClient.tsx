"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const verifyMutation = trpc.verifyEmail.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success("Email verified!");
      router.replace("/");
    },
    onError: (error) => {
      toast.error(error.message);
      setStatus("error");
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
    }
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      {status === "loading" && (
        <>
          <LoaderCircle className="animate-spin w-10 h-10 text-blue-500 mb-2" />
          <p>Verifying your email...</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
          <h1 className="text-xl font-bold">Email verified!</h1>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="w-10 h-10 text-red-500 mb-2" />
          <h1 className="text-xl font-bold">Verification error</h1>
          <p>The link may have expired or is invalid.</p>
        </>
      )}
    </div>
  );
}
