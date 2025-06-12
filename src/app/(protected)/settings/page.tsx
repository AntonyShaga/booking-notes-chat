import TwoFA from "@/components/settings/2FA/TwoFA";
import { withServerSession } from "@/lib/auth/withServerSession";
import { getUserFields } from "@/lib/getUserFields";

export default async function SettingsPage() {
  const status = await withServerSession((userId) =>
    getUserFields(userId, { twoFactorEnabled: true })
  );
  const isEnabled = status?.twoFactorEnabled ?? false;

  return (
    <div className={"flex w-full"}>
      <TwoFA isEnabled={isEnabled} />
    </div>
  );
}
