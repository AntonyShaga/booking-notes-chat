import Link from "next/link";
import { useEffect } from "react";
import CloseIcon from "@/components/icons/CloseIcon";
import Button from "@/components/ui/Button";
import Image from "next/image";

type Props = {
  toggle: () => void;
  userPicture: string | null;
  userName: string | null;
};
export default function SideMenu({ toggle, userName, userPicture }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClick = () => {
    toggle();
  };
  const hasImage = userPicture && userPicture !== "";
  return (
    <aside className="p-2 fixed flex flex-col gap-3 top-0 right-0 h-screen rounded-l-lg bg-white z-50 w-64">
      <div className={"flex justify-between items-center"}>
        <div className={"flex items-center gap-2"}>
          {hasImage ? (
            <Image
              src={userPicture}
              alt="User avatar"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-400 rounded-full" />
          )}
          <span className={"text-sm"}>{userName === null ? "User" : userName}</span>
        </div>
        <Button className={"rounded-sm bg-white p-2"} onClick={handleClick}>
          <CloseIcon className="w-4 h-4" />
        </Button>
      </div>
      <hr className="border-t border-gray-300 my-2" />
      <ul className="p-4">
        <li className="text-neutral-700 hover:text-gray-300 transition-colors duration-200">
          <Link href="/settings" onClick={handleClick}>
            Settings
          </Link>
        </li>
        <li className="text-neutral-700 hover:text-gray-300 transition-colors duration-200">
          <Link href="/" onClick={handleClick}>
            HEADER
          </Link>
        </li>
      </ul>
    </aside>
  );
}
