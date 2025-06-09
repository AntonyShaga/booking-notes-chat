import prisma from "@/lib/db";

export async function get2FAStatusServer(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  return { isEnabled: user?.twoFactorEnabled ?? false };
}
