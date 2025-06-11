"use client";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ManualSecretSection({ secret }: { secret: string | null }) {
  const copyToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success("Секрет скопирован в буфер обмена");
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
      <p className="mb-2">Введите этот секрет вручную:</p>
      <div className="flex items-center gap-2">
        <code className="bg-gray-100 p-2 block rounded break-all flex-1">
          {secret || "••••••••••••••••••••••••••••"}
        </code>
        <button
          onClick={copyToClipboard}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Копировать"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
