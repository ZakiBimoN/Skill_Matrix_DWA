const STYLES: Record<string, string> = {
  Wajib: "bg-blue-100 text-blue-800",
  Umum: "bg-slate-100 text-slate-600",
  Khusus: "bg-emerald-100 text-emerald-700",
};

export default function KategoriBadge({ kategori }: { kategori: string }) {
  return (
    <span
      className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
        STYLES[kategori] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {kategori}
    </span>
  );
}
