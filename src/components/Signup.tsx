"use client";
import AuthForm from "@/components/AuthForm";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Github } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
export default function SignUp() {
  const router = useRouter();
  const registerMutation = trpc.register.register.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/verify-pending");
    },
  });

  const handleSignup = async (data: { email: string; password: string }) => {
    registerMutation.mutate(data);
  };
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };
  const handleGitleLogin = () => {
    window.location.href = "/api/auth/github";
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className=" flex gap-2  flex-col bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <div className={"flex justify-between"}>
          <Button
            onClick={handleGoogleLogin}
            className="flex items-center bg-white text-black border border-gray-300 text-sm   rounded-xl shadow hover:shadow-md transition-all"
            leftIcon={<FcGoogle size={24} />}
          >
            Войти через Google
          </Button>
          <Button
            onClick={handleGitleLogin}
            className="flex items-center bg-white text-black border border-gray-300 text-sm   rounded-xl shadow hover:shadow-md transition-all"
            leftIcon={<Github size={24} />}
          >
            Войти через Git
          </Button>
        </div>

        <AuthForm mode="Signup" onSubmit={handleSignup} />

        <div className="min-h-[2.5rem] mt-4 transition-opacity duration-200">
          {registerMutation.error && (
            <p className="text-center text-red-500 animate-fadeIn">
              {registerMutation.error.message}
            </p>
          )}
        </div>

        <div className="text-center mt-4">
          <Link href="/signin" className="text-blue-500 font-bold underline">
            Есть аккаунт? Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
