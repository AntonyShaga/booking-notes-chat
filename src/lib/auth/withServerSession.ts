import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/verifyToken";

export async function withServerSession<T>(
  callback: (userId: string) => Promise<T>
): Promise<T | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    const userId = payload.sub;
    if (!userId) return null;

    return await callback(userId);
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
