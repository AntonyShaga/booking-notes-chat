"use client";
import AuthForm from "@/components/AuthForm";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
export default function SignUp() {
  const router = useRouter();
  const registerMutation = trpc.register.register.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  const handleSignup = async (data: { email: string; password: string }) => {
    registerMutation.mutate(data);
  };
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 bg-white text-black border border-gray-300 px-6 py-3 rounded-xl shadow hover:shadow-md transition-all"
        >
          <FcGoogle size={24} />
          Войти через Google
        </button>
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
