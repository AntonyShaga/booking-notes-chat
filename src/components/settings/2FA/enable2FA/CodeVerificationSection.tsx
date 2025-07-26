"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InputOTPControlled } from "@/components/settings/2FA/enable2FA/InputOTPControlled";

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
      className="mt-6 flex flex-col items-center justify-center gap-2"
    >
      <InputOTPControlled code={code} setCode={setCode} />
      <Button
        onClick={onConfirm}
        disabled={isLoading || code.length !== 6}
        className="w-full  text-white py-2 rounded"
      >
        {isLoading ? "Проверка..." : "Подтвердить"}
      </Button>
    </motion.div>
  );
}
