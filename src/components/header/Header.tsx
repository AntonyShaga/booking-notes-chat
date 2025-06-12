import SidebarContainer from "@/components/side-menu/SidebarContainer";
import HeaderList from "@/components/header/HeaderList";

export default function Header() {
  return (
    <header className="relative z-50 flex gap-2 container mx-auto justify-center">
      <HeaderList />
      <SidebarContainer />
    </header>
  );
}
