"use client";
import { AnimatePresence, motion } from "framer-motion";
import SideMenu from "@/components/side-menu/SideMenu";
import { useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

type User = {
  name: string | null;
  picture: string | null;
};
type SideMenuButtonProps = {
  user: User;
};

export default function SidebarContainer({ user }: SideMenuButtonProps) {
  const [toggle, setToggle] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setToggle(false), toggle);

  const logOut = trpc.logout.logout.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      window.location.href = "/signup";
    },
  });

  return (
    <div className="relative z-50 flex justify-center gap-4">
      {user ? (
        <>
          <Button
            className="flex items-center gap-2 bg-inherit"
            onClick={() => setToggle((prev) => !prev)}
          >
            {user?.picture ? (
              <Image
                src={user.picture}
                alt="User avatar"
                width={32}
                height={32}
                priority
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span
                className="w-8 h-8 bg-blue-400 rounded-full"
                role="img"
                aria-label="Заглушка аватара пользователя"
              />
            )}
            <span className="text-sm">{user.name ?? "Пользователь"}</span>
          </Button>
          <Button className={"bg-inherit"} onClick={() => logOut.mutate()}>
            Log Out
          </Button>
        </>
      ) : (
        <>
          <Link href="/signup">signup</Link>
          <Link href="/signin">signin</Link>
        </>
      )}

      {user && (
        <>
          <AnimatePresence>
            {toggle && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black/10  z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setToggle(false)}
                />

                <motion.div
                  ref={menuRef}
                  className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg z-50"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{
                    type: "tween",
                    ease: "easeInOut",
                    duration: 0.3,
                  }}
                >
                  <SideMenu
                    userName={user.name}
                    userPicture={user.picture}
                    toggle={() => setToggle(false)}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
