"use client";

import * as React from "react";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function InputOTPControlled({
  code,
  setCode,
}: {
  code: string;
  setCode: (val: string) => void;
}) {
  const handleCodeChange = (val: string) => {
    setCode(val.replace(/\D/g, ""));
  };

  return (
    <div className="space-y-2">
      <InputOTP maxLength={6} value={code} onChange={handleCodeChange}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <div className="text-center text-sm ">
        {code === "" ? <>Enter your one-time password.</> : <>You entered: {code}</>}
      </div>
    </div>
  );
}
