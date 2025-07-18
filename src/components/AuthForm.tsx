"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/shared/validations/auth";

interface AuthFormProps {
  mode: "Signing" | "Signup";
  resetForm?: boolean;
  isLoading?: boolean;
  onSubmit: (data: { email: string; password: string }) => void;
}

export default function AuthForm({ mode, resetForm, onSubmit, isLoading }: AuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (resetForm) {
      reset();
    }
  }, [resetForm, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {mode === "Signing" ? "Вход" : "Регистрация"}
      </h2>

      <div>
        <label className="block text-gray-700 dark:text-gray-300">Email</label>
        <input
          {...register("email")}
          type="email"
          className={`mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${
            errors.email ? "border-red-500" : ""
          }`}
        />
        <div className="min-h-[1.5rem] mt-1 transition-opacity duration-200">
          {errors.email && <p className="mt-1  text-sm text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-gray-700 dark:text-gray-300">Password</label>
        <input
          {...register("password")}
          type="password"
          className={`mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${
            errors.password ? "border-red-500" : ""
          }`}
        />
        <div className="min-h-[1.5rem] mt-1 transition-opacity duration-200">
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
      >
        {mode === "Signing" ? "Войти" : "Зарегистрироваться"}
      </button>
    </form>
  );
}
