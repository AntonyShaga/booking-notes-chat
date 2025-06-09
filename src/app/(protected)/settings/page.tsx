import TwoFA from "@/components/settings/2FA/TwoFA";
import prisma from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth/getServerAuthSession";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  if (!session) return null;
  console.log(session);
  const user = await prisma.user.findUnique({
    where: { id: session.user.userId },
    select: { twoFactorEnabled: true },
  });
  console.log(user);
  return (
    <div>
      <TwoFA isEnabled={user?.twoFactorEnabled ?? false} />
    </div>
  );
}
