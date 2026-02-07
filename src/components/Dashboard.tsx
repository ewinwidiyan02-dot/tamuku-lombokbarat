import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, BarChart3, BookMarked } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Fungsi untuk mengambil dan memproses data dasbor dari Supabase
const fetchDashboardData = async () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Mengambil semua data tamu dari awal bulan ini
  const { data: guests, error } = await supabase
    .from("guests")
    .select("created_at")
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  // --- Proses Kalkulasi Data ---

  // 1. Tamu Hari Ini
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayGuests = guests.filter(g => new Date(g.created_at) >= todayStart).length;

  // 2. Total Bulan Ini
  const monthlyTotal = guests.length;

  // 3. Rata-rata Harian
  const averageDaily = monthlyTotal > 0 ? monthlyTotal / today.getDate() : 0;

  // 4. Tren Mingguan (7 hari terakhir)
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return { day: days[d.getDay()], guests: 0, date: d.toDateString() };
  }).reverse();

  guests.forEach(guest => {
    const guestDate = new Date(guest.created_at).toDateString();
    const dayData = weeklyTrend.find(d => d.date === guestDate);
    if (dayData) {
      dayData.guests++;
    }
  });

  return {
    todayGuests,
    monthlyTotal,
    averageDaily,
    weeklyTrend,
  };
};

export const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
  });

  if (error) {
    return <div className="text-center text-destructive p-4">Gagal memuat data dasbor: {error.message}</div>;
  }

  const maxGuests = data ? Math.max(...data.weeklyTrend.map(d => d.guests), 1) : 1;

  return (
    <div className="w-full mb-8">
      <div className="text-center mb-6">
        <div className="inline-block p-4 bg-gradient-primary rounded-2xl shadow-medium mb-4">
          <img src="/logo.png" alt="Logo Lombok Barat" className="h-24 w-auto object-contain" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          e-Guest
        </h1>
        <p className="text-muted-foreground">
          Buku Tamu Elektronik - Bappeda Kabupaten Lombok Barat
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamu Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-primary">{data?.todayGuests}</div>}
            <p className="text-xs text-muted-foreground">
              Jumlah tamu terdaftar hari ini
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bulan Ini</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-secondary">{data?.monthlyTotal}</div>}
            <p className="text-xs text-muted-foreground">
              Akumulasi tamu bulan ini
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Harian</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-accent">{data?.averageDaily.toFixed(1)}</div>}
            <p className="text-xs text-muted-foreground">
              Tamu per hari (rata-rata bulan ini)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tren Mingguan</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2 pt-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-2 flex-1" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {data?.weeklyTrend.map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground w-8">{day.day}</span>
                    <div className="flex-1 mx-2 bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                        style={{ width: `${(day.guests / maxGuests) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">{day.guests}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};