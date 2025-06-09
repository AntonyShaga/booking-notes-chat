"use client";
import { trpc } from "@/utils/trpc";
import { useState, useEffect } from "react";
import Disable2FA from "@/components/settings/2FA/Disable2FA";
import Enable2FA from "@/components/settings/2FA/Enable2FA";

export default function TwoFA() {
  const { data: status, refetch } = trpc.twoFA.get2FAStatus.useQuery();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (status?.isEnabled) setIsEnabled(true);
  }, [status]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{isEnabled ? "2FA включена" : "Включить 2FA"}</h2>

      {isEnabled ? (
        <Disable2FA onSuccess={() => setIsEnabled(false)} />
      ) : (
        <Enable2FA
          onSuccess={() => {
            setIsEnabled(true);
            refetch();
          }}
        />
      )}
    </div>
  );
}
