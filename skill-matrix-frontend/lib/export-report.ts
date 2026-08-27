import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SkillGapDepartemen, ClusterResponse, DetailKompetensiGapRow } from "@/lib/api";

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function styleSheet(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });

  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (rowNumber > 1) {
        cell.alignment = { vertical: "middle", wrapText: true };
      }
    });
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      });
    }
  });
}

export async function exportReportExcel(
  skillGap: SkillGapDepartemen[],
  clusters: ClusterResponse | null,
  detailGap: DetailKompetensiGapRow[] = []
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Skill Matrix System";
  workbook.created = new Date();

  const sheet1 = workbook.addWorksheet("Skill Gap per Departemen");
  sheet1.columns = [
    { header: "Departemen", key: "departemen", width: 24 },
    { header: "Total Karyawan", key: "total_karyawan", width: 16 },
    { header: "Rata-rata Gap", key: "rata_rata_gap", width: 16 },
    { header: "Karyawan Gap Wajib", key: "karyawan_gap_wajib", width: 20 },
  ];
  skillGap.forEach((d) =>
    sheet1.addRow({
      departemen: d.departemen,
      total_karyawan: d.total_karyawan,
      rata_rata_gap: d.rata_rata_gap,
      karyawan_gap_wajib: d.karyawan_gap_wajib,
    })
  );
  sheet1.getColumn("rata_rata_gap").numFmt = "0.0";
  styleSheet(sheet1);

  // Sheet detail kompetensi per karyawan (cuma yang gap > 0), termasuk NIK.
  const sheetDetail = workbook.addWorksheet("Detail Kompetensi (Gap)");
  sheetDetail.columns = [
    { header: "NIK", key: "nik", width: 12 },
    { header: "Nama", key: "nama", width: 24 },
    { header: "Departemen", key: "departemen", width: 20 },
    { header: "Jabatan", key: "jabatan", width: 22 },
    { header: "Nama Kompetensi", key: "nama_kompetensi", width: 32 },
    { header: "Kategori", key: "kategori", width: 12 },
    { header: "Level Target", key: "required_level", width: 12 },
    { header: "Level Actual", key: "actual_level", width: 12 },
    { header: "Gap", key: "gap", width: 8 },
    { header: "Rekomendasi", key: "rekomendasi", width: 44 },
  ];
  detailGap.forEach((r) =>
    sheetDetail.addRow({
      nik: r.nik ?? "-",
      nama: r.nama,
      departemen: r.departemen ?? "-",
      jabatan: r.jabatan ?? "-",
      nama_kompetensi: r.nama_kompetensi,
      kategori: r.kategori.charAt(0).toUpperCase() + r.kategori.slice(1),
      required_level: r.required_level,
      actual_level: r.actual_level,
      gap: r.gap,
      rekomendasi: r.rekomendasi,
    })
  );
  styleSheet(sheetDetail);

  if (clusters) {
    const sheet2 = workbook.addWorksheet("Clustering Summary");
    sheet2.columns = [
      { header: "Cluster", key: "label", width: 18 },
      { header: "Jumlah Anggota", key: "member_count", width: 16 },
      { header: "Avg Skill Score (%)", key: "avg_skill_score", width: 18 },
      { header: "Kategori Dominan", key: "dominant_category", width: 18 },
      { header: "Kategori Terlemah", key: "weakest_category", width: 18 },
      { header: "Rekomendasi", key: "recommendation", width: 34 },
    ];
    clusters.summary.forEach((s) =>
      sheet2.addRow({
        label: s.label,
        member_count: s.member_count,
        avg_skill_score: s.avg_skill_score,
        dominant_category: s.dominant_category,
        weakest_category: s.weakest_category,
        recommendation: s.recommendation,
      })
    );
    sheet2.getColumn("avg_skill_score").numFmt = '0.0"%"';
    styleSheet(sheet2);

    const sheet3 = workbook.addWorksheet("Detail Karyawan");
    sheet3.columns = [
      { header: "Nama", key: "name", width: 26 },
      { header: "Departemen", key: "departemen", width: 22 },
      { header: "Cluster", key: "cluster_label", width: 18 },
    ];
    clusters.karyawan.forEach((k) =>
      sheet3.addRow({
        name: k.name,
        departemen: k.departemen ?? "-",
        cluster_label: k.cluster_label,
      })
    );
    styleSheet(sheet3);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `Executive_Report_Skill_Matrix_${todayStamp()}.xlsx`);
}

export function exportReportPdf(
  skillGap: SkillGapDepartemen[],
  clusters: ClusterResponse | null,
  detailGap: DetailKompetensiGapRow[] = []
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text("Executive Report - Skill Matrix", 14, 18);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Diunduh: ${new Date().toLocaleDateString("id-ID")}`, 14, 24);

  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text("Skill Gap per Departemen", 14, 34);

  autoTable(doc, {
    startY: 38,
    head: [["Departemen", "Total Karyawan", "Rata-rata Gap", "Karyawan Gap Wajib"]],
    body: skillGap.map((d) => [
      d.departemen,
      d.total_karyawan,
      d.rata_rata_gap,
      d.karyawan_gap_wajib,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 58, 138] },
  });

  // Halaman baru: detail kompetensi per karyawan (cuma yang gap > 0), + NIK
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text("Detail Kompetensi (Belum Memenuhi Target)", 14, 18);

  autoTable(doc, {
    startY: 24,
    head: [["NIK", "Nama", "Departemen", "Kompetensi", "Target", "Actual", "Gap", "Rekomendasi"]],
    body: detailGap.map((r) => [
      r.nik ?? "-",
      r.nama,
      r.departemen ?? "-",
      r.nama_kompetensi,
      `L${r.required_level}`,
      `L${r.actual_level}`,
      r.gap,
      r.rekomendasi,
    ]),
    styles: { fontSize: 7, cellWidth: "wrap" },
    headStyles: { fillColor: [30, 58, 138] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      7: { cellWidth: 55 }, // kolom Rekomendasi dilebarkan
    },
  });

  if (clusters) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Clustering Results Summary", 14, 18);

    autoTable(doc, {
      startY: 24,
      head: [["Cluster", "Jumlah", "Avg Skor", "Dominan", "Terlemah", "Rekomendasi"]],
      body: clusters.summary.map((s) => [
        s.label,
        s.member_count,
        `${s.avg_skill_score}%`,
        s.dominant_category,
        s.weakest_category,
        s.recommendation,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalY = (doc as any).lastAutoTable.finalY + 8;

    if (clusters.silhouette_score !== null) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Silhouette score: ${clusters.silhouette_score} (dihitung dari ${clusters.karyawan.length} karyawan, ${clusters.k} klaster)`,
        14,
        finalY
      );
    }

    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Detail Karyawan per Cluster", 14, 18);

    autoTable(doc, {
      startY: 24,
      head: [["Nama", "Departemen", "Cluster"]],
      body: clusters.karyawan.map((k) => [k.name, k.departemen ?? "-", k.cluster_label]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  doc.save(`Executive_Report_Skill_Matrix_${todayStamp()}.pdf`);
}
