import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Save, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GuestData {
  regNumber: string;
  firstName: string;
  lastName: string;
  nik: string;
  origin: string;
  position: string;
  bidang: string;
  contactNumber: string;
  purpose: string;
}

// This interface matches the Supabase table schema
interface SupabaseGuestData {
  reg_number: string;
  first_name: string;
  last_name: string;
  nik: string | null;
  origin: string;
  position: string | null;
  bidang: string | null;
  contact_number: string;
  purpose: string;
}

// Fungsi untuk menyimpan data tamu ke Supabase
const addGuest = async (guestData: SupabaseGuestData) => {
  const { error } = await supabase.from("guests").insert([guestData]);
  if (error) {
    throw new Error(error.message);
  }
};

const purposeOptions = [
  "Audiensi / Silaturahmi",
  "Koordinasi Perencanaan",
  "Rapat",
  "Konsultasi / Asistensi",
  "Kunjungan Kerja",
  "Undangan Khusus",
  "Seremoni",
  "Ekspedisi Surat",
];

const bidangOptions = [
  "Sekretariat",
  "Bidang Litbang Renbang",
  "Bidang Ekonomi",
  "Bidang Sosial Budaya",
  "Bidang Sarana Prasarana Wilayah",
];

// Fungsi untuk menghasilkan nomor registrasi baru
async function generateRegNumber(): Promise<string> {
  const today = new Date();
  
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const dateStr = `${day}${month}${year}`;

  // Tentukan awal bulan ini untuk query
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  // Hitung jumlah tamu yang sudah terdaftar bulan ini
  const { count, error } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth);

  if (error) {
    console.error("Gagal mengambil data tamu:", error);
    return `${dateStr}-ERR`;
  }

  // Nomor urut adalah jumlah tamu bulan ini + 1
  const sequence = (count ?? 0) + 1;

  // Reset ke 001 setiap awal bulan dengan padding 3 digit
  return `${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

export const GuestForm = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<GuestData>({
    regNumber: "Memuat...",
    firstName: "",
    lastName: "",
    nik: "",
    origin: "",
    position: "",
    bidang: "",
    contactNumber: "",
    purpose: ""
  });

  useEffect(() => {
    const setInitialRegNumber = async () => {
      const newRegNumber = await generateRegNumber();
      setFormData(prev => ({ ...prev, regNumber: newRegNumber }));
    };
    setInitialRegNumber();
  }, []);

  const mutation = useMutation({
    mutationFn: addGuest,
    onSuccess: async () => {
      toast.success("Berhasil Mendaftar", {
        description: `Selamat datang ${formData.firstName} ${formData.lastName}! Data Anda telah tersimpan.`,
      });
      
      // Notifikasi WhatsApp telah dihapus sementara
      // Jika ingin mengaktifkan kembali, tambahkan kembali kode pemanggilan Edge Function di sini.

      const newRegNumber = await generateRegNumber();

      setFormData({
        regNumber: newRegNumber,
        firstName: "",
        lastName: "",
        nik: "",
        origin: "",
        position: "",
        bidang: "",
        contactNumber: "",
        purpose: ""
      });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
    onError: (error) => {
      toast.error("Gagal Mendaftar", {
        description: `Terjadi kesalahan: ${error.message}`,
      });
    },
  });

  const handleInputChange = (field: keyof GuestData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.origin || !formData.purpose || !formData.contactNumber) {
      toast.error("Formulir Tidak Lengkap", {
        description: "Mohon lengkapi semua field yang wajib diisi.",
      });
      return;
    }

    const guestDataForSupabase: SupabaseGuestData = {
      reg_number: formData.regNumber,
      first_name: formData.firstName,
      last_name: formData.lastName,
      nik: formData.nik || null,
      origin: formData.origin,
      position: formData.position || null,
      bidang: formData.bidang || null,
      contact_number: formData.contactNumber,
      purpose: formData.purpose,
    };

    mutation.mutate(guestDataForSupabase);
  };

  return (
    <Card className="w-full max-w-2xl shadow-medium">
      <CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-lg md:text-xl">
          <UserPlus className="h-5 w-5" />
          Form Kunjungan
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regNumber">No. Registrasi *</Label>
              <Input
                id="regNumber"
                value={formData.regNumber}
                readOnly
                className="bg-muted font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => handleInputChange("nik", e.target.value)}
                placeholder="Nomor Induk Kependudukan (opsional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nama Depan *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Masukkan nama depan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nama Belakang *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Masukkan nama belakang"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Instansi/Lembaga/Alamat Domisili *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => handleInputChange("origin", e.target.value)}
                placeholder="Instansi/Lembaga/Alamat"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Jabatan</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="Jabatan (opsional)"
              />
            </div>
          </div>

          {/* New Bidang Select Input */}
          <div className="space-y-2">
            <Label htmlFor="bidang">Bidang</Label>
            <Select
              value={formData.bidang}
              onValueChange={(value) => handleInputChange("bidang", value)}
            >
              <SelectTrigger id="bidang">
                <SelectValue placeholder="Pilih bidang tujuan (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {bidangOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Nomor Kontak (Whatsapp) *</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange("contactNumber", e.target.value)}
              placeholder="Nomor Whatsapp"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Keperluan *</Label>
            <Select
              value={formData.purpose}
              onValueChange={(value) => handleInputChange("purpose", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tujuan kunjungan Anda..." />
              </SelectTrigger>
              <SelectContent>
                {purposeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full transition-all duration-300 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Kunjungan
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          * Field wajib diisi. Data yang Anda masukkan akan disimpan untuk keperluan administrasi.
        </p>
      </CardContent>
    </Card>
  );
};