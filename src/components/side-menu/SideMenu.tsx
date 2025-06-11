import { useRef } from "react";
import MenuList from "@/components/side-menu/MenuList";
import UserInfoHeader from "@/components/side-menu/UserInfoHeader";
import { useDialogAccessibility } from "@/shared/hooks/useDialogAccessibility";

type Props = {
  toggle: () => void;
  userPicture: string | null;
  userName: string | null;
};
export default function SideMenu({ toggle, userName, userPicture }: Props) {
  const ref = useRef<HTMLElement>(null);
  useDialogAccessibility(ref, toggle);

  return (
    <aside
      className="p-2 fixed flex flex-col gap-3 top-0 right-0 h-screen rounded-l-lg bg-white z-50 w-64"
      role="dialog"
      aria-modal="true"
      aria-label="Боковое меню навигации"
      ref={ref}
      tabIndex={-1}
    >
      <UserInfoHeader userName={userName} userPicture={userPicture} onClickToggle={toggle} />
      <hr className="border-t border-gray-300 my-2" />
      <MenuList onClickToggle={toggle} />
    </aside>
  );
}
