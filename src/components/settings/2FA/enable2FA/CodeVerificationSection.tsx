"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function CodeVerificationSection({
  code,
  setCode,
  onConfirm,
  isLoading,
}: {
  code: string;
  setCode: (val: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      key="verify"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="mt-6"
    >
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="6-значный код"
        maxLength={6}
        className="w-full border rounded p-2 mb-2"
      />
      <Button
        onClick={onConfirm}
        disabled={isLoading || code.length !== 6}
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        {isLoading ? "Проверка..." : "Подтвердить"}
      </Button>
    </motion.div>
  );
}
