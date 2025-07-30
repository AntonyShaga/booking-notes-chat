"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/shared/validations/auth";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/auth/auth-form/FormInput";

interface AuthFormProps {
  isLogin: boolean;
  resetForm?: boolean;
  isLoading?: boolean;
  onSubmit: (data: { email: string; password: string }) => void;
}

export default function AuthForm({ isLogin, resetForm, onSubmit, isLoading }: AuthFormProps) {
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
      <FormInput
        id="email"
        label="Email"
        type="email"
        placeholder="m@example.com"
        register={register}
        error={errors.email?.message}
      />

      <FormInput
        id="password"
        label="Password"
        placeholder={"••••••••"}
        type="password"
        register={register}
        error={errors.password?.message}
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLogin ? "Login" : "Sign Up"}
      </Button>
    </form>
  );
}
