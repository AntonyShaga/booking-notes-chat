// components/settings/TwoFA.tsx
"use client";

import { useState } from "react";
import Disable2FA from "@/components/settings/2FA/Disable2FA";
import Enable2FA from "@/components/settings/2FA/Enable2FA";

type Props = { isEnabled: boolean };

export default function TwoFA({ isEnabled: initial }: Props) {
  const [isEnabled, setIsEnabled] = useState(initial);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{isEnabled ? "2FA включена" : "Включить 2FA"}</h2>

      {isEnabled ? (
        <Disable2FA onSuccess={() => setIsEnabled(false)} />
      ) : (
        <Enable2FA onSuccess={() => setIsEnabled(true)} />
      )}
    </div>
  );
}
