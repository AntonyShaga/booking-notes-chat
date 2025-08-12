"use client";

import { useState } from "react";
import Disable2FA from "@/components/settings/2FA/Disable2FA";
import Enable2FA from "@/components/settings/2FA/enable2FA/Enable2FA";
import { motion, AnimatePresence } from "framer-motion";

type Props = { isEnabled: boolean };

export default function TwoFA({ isEnabled: initial }: Props) {
  const [isEnabled, setIsEnabled] = useState(initial);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="flex flex-col w-full gap-5"
        key={isEnabled ? "enabled" : "disabled"}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <h2 className="text-xl font-bold">{isEnabled ? "2FA is enabled" : "Enable 2FA"}</h2>
        <hr className="border-t border-gray-300 my-2" />
        <div className="max-w-md">
          {isEnabled ? (
            <Disable2FA onSuccess={() => setIsEnabled(false)} />
          ) : (
            <Enable2FA onSuccess={() => setIsEnabled(true)} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
