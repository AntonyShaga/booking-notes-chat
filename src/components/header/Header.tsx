import SidebarContainer from "@/components/side-menu/SidebarContainer";
import HeaderList from "@/components/header/HeaderList";
import { withServerSession } from "@/lib/auth/withServerSession";
import { getUserFields } from "@/lib/getUserFields";
import { AuthButtons } from "@/components/side-menu/AuthButtons";

export default async function Header() {
  const user = await withServerSession((userId) =>
    getUserFields(userId, { name: true, picture: true })
  );

  return (
    <header className="relative  z-50 flex flex-col gap-2 container mx-auto justify-center">
      <div className={"flex justify-between"}>
        <HeaderList />
        {user ? <SidebarContainer user={user} /> : <AuthButtons />}
      </div>
    </header>
  );
}
