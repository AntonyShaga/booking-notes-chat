"use client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import CopyIcon from "@/components/icons/CopyIcon";
import { Button } from "@react-email/button";

export default function ManualSecretSection({ secret }: { secret: string | null }) {
  const copyToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success("Secret copied to clipboard");
    }
  };

  return (
    <motion.div
      key="manual"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="mt-4 mb-4"
    >
      <p className="mb-2 text-center">Enter this secret manually:</p>
      <div className="flex items-center gap-2">
        <code className="bg-gray-100 p-2 block rounded break-all flex-1">
          {secret || "••••••••••••••••••••••••••••"}
        </code>
        <Button
          onClick={copyToClipboard}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Copy"
        >
          <CopyIcon />
        </Button>
      </div>
    </motion.div>
  );
}
