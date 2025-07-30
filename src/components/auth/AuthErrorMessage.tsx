"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AuthErrorMessageProps {
  error?: string;
}

export function AuthErrorMessage({ error }: AuthErrorMessageProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {error && (
        <motion.p
          key="auth-error"
          initial={{ opacity: 0, height: 0, overflow: "hidden" }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="text-center text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
