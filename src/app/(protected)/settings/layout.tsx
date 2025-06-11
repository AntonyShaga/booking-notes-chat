import SideBareSettings from "@/components/SideBareSettings";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex flex-row gap-20">
      <div className="basis-1/4">
        <SideBareSettings />
      </div>

      <div className="basis-2/2">
        <div className="w-full  my-10  flex justify-center">{children}</div>
      </div>
    </div>
  );
}
