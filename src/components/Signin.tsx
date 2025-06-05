"use client";
import AuthForm from "@/components/AuthForm";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignIn() {
  const router = useRouter();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.requires2FA) {
        sessionStorage.setItem("2fa_user_id", data.userId);
        router.push("/2fa");
        return;
      }
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogin = (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <AuthForm mode="Signin" onSubmit={handleLogin} isLoading={loginMutation.isLoading} />

        <div className="min-h-[2.5rem] mt-4 transition-opacity duration-200">
          {loginMutation.error && (
            <p className="text-center text-red-500 animate-fadeIn">{loginMutation.error.message}</p>
          )}
        </div>

        <div className="text-center mt-4">
          <Link href="/signup" className="text-blue-500 font-bold underline">
            Нет аккаунта? Зарегистрируйтесь
          </Link>
        </div>
      </div>
    </div>
  );
}
