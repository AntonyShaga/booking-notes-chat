"use client";
import { motion } from "framer-motion";

export default function QRCodeSection({ qrCode }: { qrCode: string | null }) {
  return (
    <motion.div
      key="qr"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="mt-4 mb-4"
    >
      <p className="mb-2 text-center">Отсканируйте QR-код в приложении:</p>
      {qrCode ? (
        <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto border rounded" />
      ) : (
        <div className="w-48 h-48 mx-auto border rounded bg-gray-100 animate-pulse" />
      )}
    </motion.div>
  );
}
