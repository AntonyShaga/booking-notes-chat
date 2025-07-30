"use client";
import AuthForm from "@/components/auth/auth-form/AuthForm";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Signing() {
  const router = useRouter();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
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

  const handleLogin = (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };
  const handleGitHubLogin = () => {
    window.location.href = "/api/auth/github";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <div className={"flex justify-between"}>
          <Button
            onClick={handleGoogleLogin}
            className="flex items-center    rounded-xl shadow hover:shadow-md transition-all"
          >
            Войти через Google
          </Button>
          <Button
            onClick={handleGitHubLogin}
            className="flex items-center  text-sm   rounded-xl shadow hover:shadow-md transition-all"
          >
            Войти через Git
          </Button>
        </div>

        <AuthForm mode="Signing" onSubmit={handleLogin} isLoading={loginMutation.isLoading} />

        <div className="min-h-[2.5rem] mt-4 transition-opacity duration-200">
          {loginMutation.error && (
            <p className="text-center text-red-500 animate-fadeIn">{loginMutation.error.message}</p>
          )}
        </div>

        <div className="text-center mt-4">
          <Button variant={"link"}>
            <Link href="/signup">Нет аккаунта? Зарегистрируйтесь</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
