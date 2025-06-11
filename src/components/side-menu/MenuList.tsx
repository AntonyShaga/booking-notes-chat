import Link from "next/link";
type Props = {
  onClickToggle: () => void;
};
export default function MenuList({ onClickToggle }: Props) {
  const list = [{ href: "/settings", label: "Настройки" }];
  return (
    <nav aria-label="Боковая навигация">
      <ul role="list">
        {list.map((item, index) => (
          <li
            key={index}
            className="text-neutral-700 hover:text-gray-500 hover:bg-gray-100 rounded-sm transition-colors duration-200"
          >
            <Link className="p-1" href={item.href} onClick={onClickToggle}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
