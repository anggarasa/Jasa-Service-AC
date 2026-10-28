export function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="py-16 bg-slate-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-1">
            Alur Pelayanan
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Cara Mudah Memesan Servis AC</h2>
          <p className="text-sm text-slate-400 mt-2">
            Empat langkah praktis dari pemesanan hingga ruangan Anda kembali sejuk dan segar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent text-accent flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h4 className="font-bold text-white text-base">Pilih Layanan</h4>
            <p className="text-xs text-slate-400">
              Pilih jenis perawatan seperti cuci AC, isi freon, atau perbaikan kendala.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent text-accent flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h4 className="font-bold text-white text-base">Tentukan Lokasi</h4>
            <p className="text-xs text-slate-400">
              Pastikan alamat rumah atau kantor Anda berada dalam jangkauan teknisi kami.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent text-accent flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h4 className="font-bold text-white text-base">Pilih Jadwal</h4>
            <p className="text-xs text-slate-400">
              Tentukan hari dan jam kedatangan teknisi yang paling cocok untuk Anda.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent text-accent flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h4 className="font-bold text-white text-base">Teknisi Datang</h4>
            <p className="text-xs text-slate-400">
              Teknisi tiba sesuai jadwal, melakukan pemeriksaan cermat, dan menyelesaikan pekerjaan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
