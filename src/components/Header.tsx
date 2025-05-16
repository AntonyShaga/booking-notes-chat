"use client";
import Link from "next/link";
import { trpc } from "@/utils/trpc";

export default function Header() {
  const { data: user, isLoading } = trpc.auth.getCurrentUser.useQuery();
  const refreshToken = trpc.refreshToken.refreshToken.useMutation();

  if (isLoading) return null; // или <HeaderSkeleton />
  console.log(refreshToken);
  console.log(user);
  return (
    <header className={"flex gap-2"}>
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
    </header>
  );
}
