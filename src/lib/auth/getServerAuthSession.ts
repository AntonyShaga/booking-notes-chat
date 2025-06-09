import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/verifyToken";

export async function getServerAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  console.log(token);
  if (!token) return null;

  try {
    const payload = await verifyToken(token); // { id: "...", email: "...", ... }
    console.log(payload);
    return { user: payload }; // session.user.id
  } catch {
    return null;
  }
}
