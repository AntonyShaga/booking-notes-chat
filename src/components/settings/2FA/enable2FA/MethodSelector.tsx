"use client";
import { TwoFAMethod } from "@/shared/types/twoFAMethod";

type Props = {
  method: TwoFAMethod;
  setMethod: (method: TwoFAMethod) => void;
};

export default function MethodSelector({ method, setMethod }: Props) {
  return (
    <select
      className="w-full border rounded p-2 mb-4"
      value={method}
      onChange={(e) => setMethod(e.target.value as TwoFAMethod)}
    >
      <option value="qr">QR Code</option>
      <option value="manual">Manual Entry</option>
      <option value="email">Email Code</option>
    </select>
  );
}
