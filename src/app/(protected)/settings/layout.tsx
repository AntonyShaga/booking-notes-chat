import SideBareSettings from "@/components/SideBareSettings";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={"container mx-auto flex px-80 py-10"}>
      <div>
        <SideBareSettings />
      </div>
      <div className={"flex justify-center"}>{children}</div>
    </div>
  );
}
