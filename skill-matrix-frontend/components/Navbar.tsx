"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/atasan" },
  { label: "Karyawan", href: "/karyawan" },
  { label: "Kompetensi", href: "/kompetensi" },
  { label: "Reports", href: "/reports" },
];

export default function Navbar({ rightSlot }: { rightSlot?: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-10">
          <span className="text-lg font-bold text-blue-800">
            Skill Matrix
          </span>
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "border-b-2 border-blue-700 pb-1 text-sm font-semibold text-blue-700"
                      : "pb-1 text-sm text-slate-500 hover:text-slate-800"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {rightSlot}

          <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Bell size={18} />
          </button>
          <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Settings size={18} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
            {user?.name?.charAt(0) ?? "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
