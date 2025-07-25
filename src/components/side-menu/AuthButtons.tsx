"use client";
import Link from "next/link";

export function AuthButtons() {
  return (
    <div className={"flex flex-row gap-2"}>
      <Link href="/signup">signup</Link>
      <Link href="/signing">signin</Link>
    </div>
  );
}
