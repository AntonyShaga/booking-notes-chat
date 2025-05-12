"use client";

import { useState } from "react";
import AuthForm from "@/components/AuthForm";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [isSuccessful, setIsSuccessful] = useState(false);
  const router = useRouter();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      setIsSuccessful(true);
      router.push("/dashboard");
    },
    onError: (error) => {
      setIsSuccessful(false);
    },
  });

  const handleLogin = (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        {isSuccessful ? (
          <p className="text-green-500 text-center text-lg font-semibold">Добро пожаловать!</p>
        ) : (
          <AuthForm mode="Signin" onSubmit={handleLogin} />
        )}
        {loginMutation.error && (
          <p className="text-center mt-4 text-red-500">{loginMutation.error.message}</p>
        )}
        {isSuccessful && (
          <Link href="/password/signup">
            <p className="text-center text-blue-500 font-bold underline py-4">Вернуться к входу</p>
          </Link>
        )}
      </div>
    </div>
  );
}
