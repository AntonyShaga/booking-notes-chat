import Link from "next/link";
import { useEffect } from "react";

type Props = {
  toggle: () => void; // скорее всего это setOpen(false)
};

export default function SideMenu({ toggle }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClick = () => {
    toggle(); // закрываем меню
  };

  return (
    <aside className="p-2 fixed top-0 right-0 h-screen rounded-l-lg bg-white z-50 w-64">
      <div>
        <div>
          <button className="w-5 h-5 bg-neutral-900" onClick={handleClick}></button>
        </div>
        Top menu
      </div>
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
        {/* Добавь другие пункты, если нужно */}
      </ul>
    </aside>
  );
}
