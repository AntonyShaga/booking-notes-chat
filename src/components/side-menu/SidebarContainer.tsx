"use client";
import { AnimatePresence, motion } from "framer-motion";
import SideMenu from "@/components/side-menu/SideMenu";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { toast } from "sonner";

export default function SidebarContainer() {
  const [toggle, setToggle] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: user } = trpc.auth.getCurrentUser.useQuery();

  const logOut = trpc.logout.logout.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      window.location.href = "/signup";
    },
  });

  // Закрытие при клике вне меню
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setToggle(false);
      }
    };

    if (toggle) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [toggle]);

  return (
    <header className="relative z-50 flex gap-2 container mx-auto justify-center">
      {user ? (
        <span>Привет, {user.email}</span>
      ) : (
        <>
          <Link href="/signup">signup</Link>
          <Link href="/signin">signin</Link>
        </>
      )}

      <button onClick={() => logOut.mutate()}>Log Out</button>

      {user && (
        <>
          <div>
            <button className="w-5 h-5 bg-neutral-900" onClick={() => setToggle((prev) => !prev)} />
          </div>

          <AnimatePresence>
            {toggle && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black/10  z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setToggle(false)}
                />

                <motion.div
                  ref={menuRef}
                  className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg z-50"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{
                    type: "tween",
                    ease: "easeInOut",
                    duration: 0.3,
                  }}
                >
                  <SideMenu
                    userName={user.name}
                    userPicture={user.picture}
                    toggle={() => setToggle(false)}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </header>
  );
}
