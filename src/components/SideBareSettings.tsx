"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const list = [
  { name: "Security", link: "/settings" },
  { name: "Change Password", link: "/settings/change-password" },
];

export default function SideBareSettings() {
  const pathname = usePathname();

  return (
    <nav className="px-2 py-2 my-10 bg-white min-h-screen">
      <ul className="flex flex-col gap-1">
        {list.map((item, index) => {
          const isActive = pathname === item.link;

          return (
            <li key={index} className="flex items-stretch gap-2">
              <div
                className={`w-1 rounded transition-colors duration-300 ${
                  isActive ? "bg-blue-500" : "bg-transparent"
                }`}
              />
              <Link
                href={item.link}
                className={`
                  flex-1 px-3 py-1 rounded-sm
                  text-sm text-neutral-800
                  transition-colors duration-300
                  ${isActive ? "bg-neutral-200 font-medium" : "hover:bg-neutral-100"}
              `}
              >
                <span className="block leading-tight">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
