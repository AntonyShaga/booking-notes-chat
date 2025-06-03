import SideBareSettings from "@/components/SideBareSettings";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex px-50 py-10">
      {/* Сайдбар - фиксированная ширина */}
      <div className="w-64 flex-shrink-0">
        <SideBareSettings />
      </div>

      {/* Основной контент - растягивается и центрируется */}
      <div className="flex-1 flex justify-center pl-8">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
