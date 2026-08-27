"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ClusterKaryawan } from "@/lib/api";

const CLUSTER_COLORS: Record<string, string> = {
  "Top Talent": "#1d4ed8",
  Emerging: "#16a34a",
  "Gap Critical": "#dc2626",
};

const CLUSTER_ORDER = ["Top Talent", "Emerging", "Gap Critical"];

type Mode = "cluster" | "departemen";

/** Ellipse pembungkus (bukan hull tajam) — hasilnya bentuk oval mulus,
 * lebih mirip "blob" seperti referensi, tidak lancip walau titiknya sedikit. */
function boundingEllipse(points: [number, number][], padding: number) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const rx = Math.max(...points.map((p) => Math.abs(p[0] - cx)), 20) + padding;
  const ry = Math.max(...points.map((p) => Math.abs(p[1] - cy)), 20) + padding;
  return { cx, cy, rx, ry };
}

const W = 600;
const H = 280;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 30 };

export default function ClusterScatterChart({ data }: { data: ClusterKaryawan[] }) {
  const [mode, setMode] = useState<Mode>("cluster");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const { scaleX, scaleY } = useMemo(() => {
    const xs = data.map((d) => d.pca_x);
    const ys = data.map((d) => d.pca_y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const padX = (xMax - xMin || 1) * 0.15;
    const padY = (yMax - yMin || 1) * 0.15;
    const x0 = xMin - padX, x1 = xMax + padX;
    const y0 = yMin - padY, y1 = yMax + padY;
    const innerW = W - MARGIN.left - MARGIN.right;
    const innerH = H - MARGIN.top - MARGIN.bottom;

    return {
      scaleX: (x: number) => MARGIN.left + ((x - x0) / (x1 - x0 || 1)) * innerW,
      scaleY: (y: number) => MARGIN.top + (1 - (y - y0) / (y1 - y0 || 1)) * innerH,
    };
  }, [data]);

  const clusterGroups = useMemo(() => {
    const map = new Map<string, ClusterKaryawan[]>();
    for (const d of data) {
      if (!map.has(d.cluster_label)) map.set(d.cluster_label, []);
      map.get(d.cluster_label)!.push(d);
    }
    return map;
  }, [data]);

  // Data untuk stacked bar chart "Per Departemen": jumlah karyawan tiap
  // cluster_label, dikelompokkan per departemen.
  const barData = useMemo(() => {
    const depts = Array.from(new Set(data.map((d) => d.departemen ?? "Tanpa Departemen")));
    const activeLabels = CLUSTER_ORDER.filter((l) => data.some((d) => d.cluster_label === l));

    return depts.map((dept) => {
      const row: Record<string, number | string> = { departemen: dept };
      for (const label of activeLabels) {
        row[label] = data.filter(
          (d) => (d.departemen ?? "Tanpa Departemen") === dept && d.cluster_label === label
        ).length;
      }
      return row;
    });
  }, [data]);

  const activeLabels = CLUSTER_ORDER.filter((l) => data.some((d) => d.cluster_label === l));
  const hovered = data.find((d) => d.id === hoveredId);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setMode("cluster")}
            className={`px-3 py-1.5 font-medium ${
              mode === "cluster" ? "bg-slate-800 text-white" : "bg-white text-slate-500"
            }`}
          >
            Per Cluster
          </button>
          <button
            onClick={() => setMode("departemen")}
            className={`px-3 py-1.5 font-medium ${
              mode === "departemen" ? "bg-slate-800 text-white" : "bg-white text-slate-500"
            }`}
          >
            Per Departemen
          </button>
        </div>
      </div>

      {mode === "cluster" ? (
        <>
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-[280px] w-full">
              <defs>
                <filter id="blob-blur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="14" />
                </filter>
              </defs>

              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={W - MARGIN.left - MARGIN.right}
                height={H - MARGIN.top - MARGIN.bottom}
                fill="none"
                stroke="#e2e8f0"
              />

              {Array.from(clusterGroups.entries()).map(([label, members]) => {
                const points = members.map((d): [number, number] => [scaleX(d.pca_x), scaleY(d.pca_y)]);
                const { cx, cy, rx, ry } = boundingEllipse(points, 24);
                const color = CLUSTER_COLORS[label] ?? "#94a3b8";

                return (
                  <g key={label}>
                    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} fillOpacity={0.15} filter="url(#blob-blur)" />
                    <text
                      x={cx}
                      y={cy - ry + 16}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                      fill={color}
                      style={{ textTransform: "uppercase" }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {data.map((d) => (
                <circle
                  key={d.id}
                  cx={scaleX(d.pca_x)}
                  cy={scaleY(d.pca_y)}
                  r={hoveredId === d.id ? 6 : 4.5}
                  fill={CLUSTER_COLORS[d.cluster_label] ?? "#94a3b8"}
                  stroke="#fff"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredId(d.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer transition-all"
                />
              ))}
            </svg>

            {hovered && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-md"
                style={{
                  left: `${(scaleX(hovered.pca_x) / W) * 100}%`,
                  top: `${(scaleY(hovered.pca_y) / H) * 100}%`,
                }}
              >
                <p className="font-semibold text-slate-800">{hovered.name}</p>
                <p className="text-slate-500">
                  {hovered.cluster_label} • {hovered.departemen ?? "-"}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            {activeLabels.map((label) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CLUSTER_COLORS[label] ?? "#94a3b8" }}
                />
                {label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="departemen"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, top: -8 }}
              />
              {activeLabels.map((label, i) => (
                <Bar
                  key={label}
                  name={label}
                  dataKey={label}
                  stackId="cluster"
                  fill={CLUSTER_COLORS[label] ?? "#94a3b8"}
                  radius={i === activeLabels.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-slate-400">
            Jumlah karyawan tiap klaster (Top Talent/Emerging/Gap Critical), dikelompokkan per departemen.
          </p>
        </>
      )}
    </div>
  );
}
