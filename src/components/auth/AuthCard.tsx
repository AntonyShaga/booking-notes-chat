"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AuthProviders } from "@/components/auth/AuthProviders";
import AuthForm from "@/components/auth/auth-form/AuthForm";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { motion } from "framer-motion";

interface Props {
  isLogin: boolean;
}

export function AuthCard({ isLogin }: Props) {
  const router = useRouter();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      console.log(data);
      if (data.requires2FA) {
        sessionStorage.setItem("2fa_user_id", data.userId);
        router.push("/2fa");
        return;
      }
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const registerMutation = trpc.register.register.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/verify-pending");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleOnClick = (data: { email: string; password: string }) => {
    if (isLogin) {
      loginMutation.mutate(data);
    } else {
      registerMutation.mutate(data);
    }
  };

  const error = isLogin ? loginMutation.error?.message : registerMutation.error?.message;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="flex items-start justify-center h-[calc(100vh-105px)] pt-5  md:pt-20"
    >
      <Card className="overflow-hidden w-80 md:w-96">
        <CardHeader>
          <AuthHeader isLogin={isLogin} />
        </CardHeader>

        <CardContent className="flex flex-col gap-2 justify-center">
          <AuthForm
            isLogin={isLogin}
            onSubmit={handleOnClick}
            isLoading={loginMutation.isLoading}
          />
          <AuthErrorMessage error={error} />
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <AuthProviders isLogin={isLogin} />
        </CardFooter>
      </Card>
    </motion.div>
  );
}
