"use client";
import Link from "next/link";

export function AuthButtons() {
  return (
    <>
      <Link href="/signup">signup</Link>
      <Link href="/signin">signin</Link>
    </>
  );
}
