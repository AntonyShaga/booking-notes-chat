"use client";

import { motion } from "framer-motion";

interface AuthErrorMessageProps {
  error?: string;
}

export function AuthErrorMessage({ error }: AuthErrorMessageProps) {
  return (
    <motion.p
      key="auth-error"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="text-center text-sm text-red-500"
    >
      {error}
    </motion.p>
  );
}
