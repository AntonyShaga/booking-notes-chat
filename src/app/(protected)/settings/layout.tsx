import SideBareSettings from "@/components/SideBareSettings";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex  ">
      <div className=" flex-shrink-0">
        <SideBareSettings />
      </div>

      <div className="flex-1  flex  ">
        <div className="w-full  flex justify-center">{children}</div>
      </div>
    </div>
  );
}
