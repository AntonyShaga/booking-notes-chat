"use client";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { data: user, isLoading } = trpc.auth.getCurrentUser.useQuery();
  const refreshToken = trpc.refreshToken.refreshToken.useMutation();
  const logOut = trpc.logout.logout.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      window.location.href = "/signup";
    },
  });

  if (isLoading) return null; // или <HeaderSkeleton />
  console.log(user);
  return (
    <header className={"flex gap-2 container mx-auto justify-center "}>
      <nav className="space-x-6 hidden md:flex">
        <Link href="/">Главная</Link>
        <Link href="/bookings">Бронирование</Link>
        <Link href="/orders">Заказы</Link>
      </nav>

      {user ? (
        <span>Привет, {user.email}</span>
      ) : (
        <>
          <Link href="/signup">signup</Link>
          <Link href="/signin">signin</Link>
        </>
      )}

      <button onClick={() => refreshToken.mutate()}>refreshToken</button>
      <button onClick={() => logOut.mutate()}>Log Out</button>
      {user && (
        <div>
          <div>
            <button
              className={"w-5 h-5 bg-neutral-900"}
              onClick={() => setOpen((prev) => !prev)}
            ></button>
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                className="absolute right-0 top-0 h-[calc(100vh-30px)] w-64 bg-white shadow-lg"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              >
                <Sidebar open={() => setOpen((prev) => !prev)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </header>
  );
}
