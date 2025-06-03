import SideBareSettings from "@/components/SideBareSettings";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={"container mx-auto flex px-80"}>
      <div>
        <SideBareSettings />
      </div>
      <div>{children}</div>
    </div>
  );
}
