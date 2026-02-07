import { Dashboard } from "@/components/Dashboard";
import { GuestForm } from "@/components/GuestForm";
import { ReportExporter } from "@/components/ReportExporter";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <Dashboard />

        <div className="w-full max-w-4xl mx-auto my-8 overflow-hidden text-primary">
          <div className="whitespace-nowrap animate-marquee py-3">
            <span className="mx-8 text-lg font-medium">Selamat Datang di Bapperida Kabupaten Lombok Barat</span>
            <span className="mx-8 text-lg font-medium">Selamat Datang di Bapperida Kabupaten Lombok Barat</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <ReportExporter />
          <GuestForm />
        </div>
      </div>
    </div>
  );
};

export default Index;