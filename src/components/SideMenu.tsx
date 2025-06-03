import Link from "next/link";
import { useEffect } from "react";

type Props = {
  open: () => void;
};

export default function SideMenu({ open }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <aside className={"p-2 fixed top-0 right-0 h-screen rounded-l-lg  bg-white z-50 w-64"}>
      <div>
        <div>
          <button className={"w-5 h-5 bg-neutral-900"} onClick={open}></button>
        </div>
        Top menu
      </div>
      <ul className="p-4">
        <li className="text-neutral-700 hover:text-gray-300 transition-colors duration-200">
          <Link href="/settings">Settings</Link>
        </li>
      </ul>
    </aside>
  );
}
