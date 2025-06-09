import TwoFA from "@/components/settings/2FA/TwoFA";
import { getServerAuthSession } from "@/lib/auth/getServerAuthSession";
import { get2FAStatusServer } from "@/lib/auth/get2FAStatusServer";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  if (!session) return null;

  const status = await get2FAStatusServer(session.user.userId);
  return (
    <div>
      <TwoFA isEnabled={status.isEnabled} />
    </div>
  );
}
