import SideBareSettings from "@/components/SideBareSettings";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex px-50 py-10">
      <div className="w-64 flex-shrink-0">
        <SideBareSettings />
      </div>

      <div className="flex-1 min-w-full flex justify-center pl-8 ">
        <div className="w-full max-w-2xl flex justify-center">{children}</div>
      </div>
    </div>
  );
}
