import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getUserFields<T extends Prisma.UserSelect>(
  userId: string,
  select: T
): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select,
  });
}
