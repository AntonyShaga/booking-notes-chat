import { getHeaderList } from "@/lib/getHeaderList";
import Link from "next/link";

export default async function HeaderList() {
  const list = await getHeaderList();
  return (
    <nav className="space-x-6 hidden md:flex">
      <ul className={"flex gap-5 items-center"}>
        {list.map((item, index) => (
          <li key={index}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
