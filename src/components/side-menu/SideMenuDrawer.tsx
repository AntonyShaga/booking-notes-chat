"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import SideMenu from "@/components/side-menu/SideMenu";
import { useRef } from "react";

type Props = {
  isOpen: boolean;
  close: () => void;
  userName: string | null;
  userPicture: string | null;
};

export function SideMenuDrawer({ isOpen, close, userName, userPicture }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, close, isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/10 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <motion.div
            ref={menuRef}
            className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg z-50"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
          >
            <SideMenu userName={userName} userPicture={userPicture} toggle={close} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
