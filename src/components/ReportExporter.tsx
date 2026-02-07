import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileDown, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx-js-style";
import { format } from "date-fns";
import { id } from "date-fns/locale"; // Import locale for Indonesian month names

const CORRECT_PASSWORD = "17041958";

const fetchGuestDataForReport = async (startDate: Date, endDate: Date) => {
  const { data, error } = await supabase
    .from("guests")
    .select("reg_number, first_name, last_name, origin, purpose, created_at, contact_number, satisfaction")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

interface FormattedGuestData {
  "No.": number;
  "No. Registrasi": string;
  "Nama Lengkap": string;
  "Instansi/Lembaga/Domisili": string;
  "Nomor Kontak": string;
  Keperluan: string;
  "Kepuasan Layanan": string;
  "Tanggal Kunjungan": string;
}

export const ReportExporter = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [reportType, setReportType] = useState("daily"); // Default to daily
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);

  // Generate years from 2024 to current year + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: (currentYear + 1) - 2024 + 1 }, (_, i) => (2024 + i).toString()).reverse();

  const handleExport = async () => {
    if (password !== CORRECT_PASSWORD) {
      toast.error("Password Salah", {
        description: "Silakan masukkan password yang benar untuk melanjutkan.",
      });
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Mempersiapkan laporan...");

    try {
      const today = new Date();
      let startDate: Date;
      let endDate: Date = today; // Default endDate to today (current time)
      let reportName: string;

      // Set today's date to the beginning of the day for accurate filtering
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (reportType === "daily") {
        startDate = todayStart;
        reportName = `Laporan_Tamu_Harian_${format(today, "yyyy-MM-dd")}`;
      } else if (reportType === "weekly") {
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0); // Ensure it starts from the beginning of the day
        reportName = `Laporan_Tamu_Mingguan_${format(today, "yyyy-MM-dd")}`;
      } else if (reportType === "monthly") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0); // Ensure it starts from the beginning of the month
        reportName = `Laporan_Tamu_Bulanan_${format(today, "MMMM-yyyy", { locale: id })}`;
      } else if (reportType === "previousMonth") {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
        endDate.setHours(23, 59, 59, 999); // End of the day
        reportName = `Laporan_Tamu_Bulan_Sebelumnya_${format(startDate, "MMMM-yyyy", { locale: id })}`;
      } else if (reportType === "annual") {
        startDate = new Date(parseInt(selectedYear), 0, 1); // Jan 1st
        endDate = new Date(parseInt(selectedYear), 11, 31); // Dec 31st
        endDate.setHours(23, 59, 59, 999);
        reportName = `Laporan_Tamu_Tahunan_${selectedYear}`;
      } else {
        // Fallback or error handling for unknown reportType
        toast.error("Jenis laporan tidak valid.");
        setIsLoading(false);
        toast.dismiss(toastId);
        return;
      }

      toast.loading("Mengambil data tamu...", { id: toastId });
      const guests = await fetchGuestDataForReport(startDate, endDate);

      if (guests.length === 0) {
        toast.info("Tidak Ada Data", {
          id: toastId,
          description: "Tidak ada data tamu yang ditemukan untuk periode yang dipilih.",
        });
        setIsLoading(false);
        return;
      }

      toast.loading("Membuat file Excel...", { id: toastId });

      const formattedData: FormattedGuestData[] = guests.map((guest, index) => ({
        "No.": guests.length - index,
        "No. Registrasi": guest.reg_number,
        "Nama Lengkap": `${guest.first_name} ${guest.last_name}`,
        "Instansi/Lembaga/Domisili": guest.origin,
        "Nomor Kontak": guest.contact_number || "-",
        "Keperluan": guest.purpose,
        "Kepuasan Layanan": guest.satisfaction || "-",
        "Tanggal Kunjungan": format(new Date(guest.created_at), "dd MMMM yyyy, HH:mm", { locale: id }),
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData, { origin: "A3" } as XLSX.JSON2SheetOpts);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tamu");

      // Add Header
      XLSX.utils.sheet_add_aoa(worksheet, [["Buku Tamu Bapperida Lombok Barat"]], { origin: "A1" });

      // Merge Header (A1 to H1 - 8 columns)
      if (!worksheet["!merges"]) worksheet["!merges"] = [];
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

      // Style Header
      if (worksheet["A1"]) {
        worksheet["A1"].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }

      const colWidths = Object.keys(formattedData[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...formattedData.map(row => (row[key as keyof FormattedGuestData] ? row[key as keyof FormattedGuestData]!.toString().length : 0))
        )
      }));
      worksheet["!cols"] = colWidths;

      XLSX.writeFile(workbook, `${reportName}.xlsx`);

      toast.success("Laporan Berhasil Diekspor", {
        id: toastId,
        description: `${guests.length} data tamu telah diekspor ke file Excel.`,
      });

      setIsDialogOpen(false);
      setPassword("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui";
      toast.error("Gagal Mengekspor Laporan", {
        id: toastId,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-soft">
          <FileDown className="h-4 w-4 mr-2" />
          Cetak Laporan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cetak Laporan Kunjungan</DialogTitle>
          <DialogDescription>
            Masukkan password untuk mengunduh laporan dalam format Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Jenis Laporan</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Pilih jenis laporan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Laporan Harian (hari ini)</SelectItem>
                <SelectItem value="weekly">Laporan Mingguan (7 hari terakhir)</SelectItem>
                <SelectItem value="monthly">Laporan Bulanan (bulan ini)</SelectItem>
                <SelectItem value="previousMonth">Laporan Bulan Sebelumnya</SelectItem>
                <SelectItem value="annual">Cetak Laporan Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "annual" && (
            <div className="space-y-2">
              <Label htmlFor="year">Pilih Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengekspor...
              </>
            ) : (
              "Cetak Laporan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};