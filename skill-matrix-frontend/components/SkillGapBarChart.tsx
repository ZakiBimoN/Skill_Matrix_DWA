"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SkillGapDepartemen } from "@/lib/api";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: SkillGapDepartemen }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      <p className="text-blue-600">Total Karyawan: {row.total_karyawan}</p>
      <p className="text-blue-900">Rata-rata Gap: {row.rata_rata_gap}</p>
      <p className="text-red-600">Karyawan Gap Wajib: {row.karyawan_gap_wajib}</p>
    </div>
  );
}

export default function SkillGapBarChart({ data }: { data: SkillGapDepartemen[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">Belum ada data.</p>;

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="departemen"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, top: -12 }}
          />
          <Bar name="Total Karyawan" dataKey="total_karyawan" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          <Bar name="Rata-rata Gap" dataKey="rata_rata_gap" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-slate-400">
        Arahkan kursor ke tiap batang untuk lihat detail, termasuk jumlah karyawan dengan gap di kompetensi Wajib.
      </p>
    </>
  );
}
