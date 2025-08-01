"use client";
import { useState } from "react";

import { UserAvatar } from "./UserAvatar";
import { LogoutButton } from "@/components/side-menu/LogoutButton";
import { AuthButtons } from "@/components/side-menu/AuthButtons";
import { SideMenuDrawer } from "@/components/side-menu/SideMenuDrawer";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";

type Props = {
  user: {
    name: string | null;
    picture: string | null;
  };
};

export default function SidebarContainer({ user }: Props) {
  const [toggle, setToggle] = useState(false);
  trpc.auth.getCurrentUser.useQuery();
  const closeDrawer = () => setToggle(false);

  return (
    <div className="relative z-50 flex justify-center gap-4">
      {user ? (
        <>
          <Button
            className="flex items-center gap-2 "
            variant={"link"}
            onClick={() => setToggle(!toggle)}
          >
            <UserAvatar picture={user.picture ?? ""} name={user.name ?? "Пользователь"} />
          </Button>
          <LogoutButton />
        </>
      ) : (
        <AuthButtons />
      )}

      {user && (
        <SideMenuDrawer
          isOpen={toggle}
          close={closeDrawer}
          userName={user.name}
          userPicture={user.picture}
        />
      )}
    </div>
  );
}
