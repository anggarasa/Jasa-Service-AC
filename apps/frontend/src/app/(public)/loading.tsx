export default function PublicLoading() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-500 font-medium">Memuat data layanan CoolCare...</p>
    </div>
  );
}
