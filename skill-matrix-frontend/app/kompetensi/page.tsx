"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Pencil, Trash2, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import LevelIcon from "@/components/LevelIcon";
import KategoriBadge from "@/components/KategoriBadge";
import KompetensiFormModal from "@/components/KompetensiFormModal";
import {
  KompetensiItem,
  DepartemenItem,
  getKompetensiList,
  deleteKompetensi,
  getDepartemenList,
} from "@/lib/api";

const PAGE_SIZE = 6;

export default function KompetensiPage() {
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("Semua Kategori");
  const [departemenFilter, setDepartemenFilter] = useState("Semua Departemen");
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<KompetensiItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departemenList, setDepartemenList] = useState<DepartemenItem[]>([]);

  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; data: KompetensiItem | null } | null>(null);

  useEffect(() => {
    getDepartemenList().then(setDepartemenList).catch(() => {});
  }, []);

  const fetchList = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getKompetensiList({
      search: search || undefined,
      kategori: kategoriFilter === "Semua Kategori" ? undefined : kategoriFilter.toLowerCase(),
      departemen: departemenFilter === "Semua Departemen" ? undefined : departemenFilter,
      page,
      per_page: PAGE_SIZE,
    })
      .then((res) => {
        setItems(res.data);
        setTotalPages(res.last_page);
        setTotal(res.total);
      })
      .catch(() => setError("Gagal memuat daftar kompetensi."))
      .finally(() => setIsLoading(false));
  }, [search, kategoriFilter, departemenFilter, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const allOnPageSelected = items.length > 0 && items.every((k) => selected.includes(k.id));

  function toggleSelectAll() {
    if (allOnPageSelected) {
      setSelected((prev) => prev.filter((id) => !items.some((k) => k.id === id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...items.map((k) => k.id)])]);
    }
  }

  function toggleSelectOne(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  }

  async function handleDeleteSelected() {
    if (selected.length === 0) return;
    if (!confirm(`Hapus ${selected.length} kompetensi terpilih? Aksi ini tidak bisa dibatalkan.`)) return;

    await Promise.all(selected.map((id) => deleteKompetensi(id)));
    setSelected([]);
    fetchList();
  }

  async function handleDeleteOne(id: number) {
    if (!confirm("Hapus kompetensi ini?")) return;
    await deleteKompetensi(id);
    fetchList();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Kompetensi</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola daftar kompetensi teknis dan umum dalam organisasi.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              disabled={selected.length !== 1}
              onClick={() => {
                const data = items.find((k) => k.id === selected[0]) ?? null;
                setFormModal({ mode: "edit", data });
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              disabled={selected.length === 0}
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} /> Hapus
            </button>
            <button
              onClick={() => setFormModal({ mode: "create", data: null })}
              className="flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
            >
              <Plus size={14} /> Tambah Kompetensi Baru
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kompetensi..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-300 focus:outline-none"
            />
          </div>
          <select
            value={kategoriFilter}
            onChange={(e) => {
              setKategoriFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
          >
            {["Semua Kategori", "Wajib", "Umum", "Khusus"].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={departemenFilter}
            onChange={(e) => {
              setDepartemenFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
          >
            <option>Semua Departemen</option>
            {departemenList.map((d) => (
              <option key={d.id}>{d.nama_departement}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isLoading && <p className="p-6 text-center text-sm text-slate-400">Memuat...</p>}
          {error && <p className="p-6 text-center text-sm text-red-500">{error}</p>}

          {!isLoading && !error && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} className="rounded border-slate-300" />
                  </th>
                  <th className="px-4 py-3 font-medium">Nama Kompetensi</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Target Departemen</th>
                  <th className="px-4 py-3 font-medium">Required Level</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((k) => (
                  <tr key={k.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(k.id)}
                        onChange={() => toggleSelectOne(k.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-800">
                      {k.nama_kompetensi}
                      {k.sub_kelompok && (
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          ({k.sub_kelompok})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <KategoriBadge kategori={k.kategori.charAt(0).toUpperCase() + k.kategori.slice(1)} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{k.departemen_label}</td>
                    <td className="px-4 py-3">
                      <LevelIcon level={k.required_level} size={18} outlineOnly />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 text-slate-400">
                        <button onClick={() => setFormModal({ mode: "edit", data: k })} className="hover:text-blue-700" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteOne(k.id)} className="hover:text-red-600" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada kompetensi yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!isLoading && !error && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>
                Menampilkan {items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, total)} dari {total} kompetensi
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-slate-200 px-2 py-1 disabled:opacity-30"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded px-2 py-1 ${p === page ? "bg-blue-700 text-white" : "border border-slate-200 hover:bg-slate-50"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded border border-slate-200 px-2 py-1 disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {formModal && (
        <KompetensiFormModal
          initialData={formModal.data}
          onClose={() => setFormModal(null)}
          onSuccess={() => {
            setSelected([]);
            fetchList();
          }}
        />
      )}
    </div>
  );
}
