"use client";
import { AnimatePresence } from "framer-motion";
import QRCodeSection from "./QRCodeSection";
import ManualSecretSection from "./ManualSecretSection";
import CodeVerificationSection from "./CodeVerificationSection";

type Props = {
  method: TwoFAMethod;
  qrCode: string | null;
  manualSecret: string | null;
  code: string;
  setCode: (val: string) => void;
  isLoading: boolean;
  onConfirm: () => void;
};

export default function VerificationSection({
  method,
  qrCode,
  manualSecret,
  code,
  setCode,
  isLoading,
  onConfirm,
}: Props) {
  return (
    <AnimatePresence mode="wait">
      {(method === "qr" || qrCode) && <QRCodeSection qrCode={qrCode} key="qr-code-section" />}
      {(method === "manual" || manualSecret) && (
        <ManualSecretSection secret={manualSecret} key="manual-secret-section" />
      )}
      {(method === "email" || qrCode || manualSecret) && (
        <CodeVerificationSection
          key={`code-verification-${method}`}
          code={code}
          setCode={setCode}
          isLoading={isLoading}
          onConfirm={onConfirm}
        />
      )}
    </AnimatePresence>
  );
}
