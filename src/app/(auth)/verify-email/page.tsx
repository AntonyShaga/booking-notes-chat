import VerifyClient from "@/components/verify/VerifyClient";
import { Suspense } from "react";

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyClient />;
    </Suspense>
  );
}
