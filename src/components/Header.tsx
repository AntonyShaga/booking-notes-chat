"use client";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export default function Header() {
  const { data: user, isLoading } = trpc.auth.getCurrentUser.useQuery();
  const refreshToken = trpc.refreshToken.refreshToken.useMutation();
  const logOut = trpc.logout.logout.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
  });

  if (isLoading) return null; // или <HeaderSkeleton />
  console.log(refreshToken);
  console.log(user);
  return (
    <header className={"flex gap-2 container mx-auto justify-center"}>
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
      <div>
        <button className={"w-5 h-5 bg-neutral-900"}></button>
      </div>
    </header>
  );
}
