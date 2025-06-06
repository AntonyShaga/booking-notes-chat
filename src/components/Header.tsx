"use client";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SideMenu from "@/components/SideMenu";

export default function Header() {
  const [toggle, setToggle] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: user, isLoading } = trpc.auth.getCurrentUser.useQuery();

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
  }, [open]);

  if (isLoading) return null;

  return (
    <header className="flex gap-2 container mx-auto justify-center">
      <nav className="space-x-6 hidden md:flex">
        <Link href="/">Главная</Link>
        <Link href="/bookings">Бронирование</Link>
        <Link href="/orders">Заказы</Link>
        <Link href="/dashboard">dashboard</Link>
      </nav>

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
        <div>
          <div>
            <button
              className="w-5 h-5 bg-neutral-900"
              onClick={() => setToggle((prev) => !prev)}
            ></button>
          </div>

          <AnimatePresence>
            {toggle && (
              <motion.div
                ref={menuRef}
                className="absolute right-0 top-0 h-[calc(100vh-30px)] w-64 bg-white shadow-lg"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "tween",
                  ease: "easeInOut",
                  duration: 0.3,
                }}
              >
                <SideMenu toggle={() => setToggle(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </header>
  );
}
