"use client";
import Link from "next/link";

export function AuthButtons() {
  return (
    <div className={"flex flex-row gap-2"}>
      <Link href="/signup">Sign Up</Link>
      <Link href="/login">Login</Link>
    </div>
  );
}
