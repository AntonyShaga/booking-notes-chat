import Button from "@/components/ui/Button";
import { getHeaderList } from "@/lib/getHeaderList";

export default async function HeaderList() {
  const list = await getHeaderList();
  return (
    <nav className="space-x-6 hidden md:flex">
      <ul className={"flex gap-5"}>
        {list.map((item, index) => (
          <li key={index}>
            <Button href={item.href}>{item.label}</Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
