import Link from "next/link";

export default function SideBareSettings() {
  return (
    <div className={"px-8"}>
      <ul>
        <li>
          <Link href={"/settings"}>security</Link>
        </li>
      </ul>
    </div>
  );
}
