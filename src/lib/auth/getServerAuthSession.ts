import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/verifyToken";

export async function getServerAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const payload = await verifyToken(token);

    return { user: payload };
  } catch {
    return null;
  }
}
