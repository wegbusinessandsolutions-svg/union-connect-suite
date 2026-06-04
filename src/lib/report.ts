// Shared analytical report utility — generates printable HTML and downloadable PDF
// for a single selected item across every module.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportField = { label: string; value: string | number | null | undefined };
export type ReportSection = { title: string; fields: ReportField[] };
export type ReportTable = { title: string; columns: string[]; rows: (string | number | null | undefined)[][] };

export type ReportData = {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
  tables?: ReportTable[];
};

const fmt = (v: ReportField["value"]) => {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
};

export function buildReportHtml(data: ReportData): string {
  const today = new Date().toLocaleString("pt-BR");
  const sectionsHtml = data.sections
    .map(
      (s) => `
      <section>
        <h2>${escapeHtml(s.title)}</h2>
        <table class="kv">
          <tbody>
            ${s.fields
              .map(
                (f) =>
                  `<tr><th>${escapeHtml(f.label)}</th><td>${escapeHtml(fmt(f.value))}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </section>`,
    )
    .join("");

  const tablesHtml = (data.tables ?? [])
    .map(
      (t) => `
      <section>
        <h2>${escapeHtml(t.title)}</h2>
        <table class="grid">
          <thead><tr>${t.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
          <tbody>
            ${t.rows
              .map(
                (r) =>
                  `<tr>${r.map((c) => `<td>${escapeHtml(fmt(c))}</td>`).join("")}</tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </section>`,
    )
    .join("");

  return `<!doctype html>
  <html lang="pt-BR"><head><meta charset="utf-8"/>
  <title>${escapeHtml(data.title)}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;margin:24px;font-size:12px}
    header{border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end}
    header h1{margin:0;font-size:18px}
    header .meta{font-size:11px;color:#555}
    h2{font-size:13px;margin:18px 0 6px;border-bottom:1px solid #ccc;padding-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
    table{border-collapse:collapse;width:100%}
    table.kv th{width:32%;text-align:left;padding:4px 8px;background:#f5f5f5;font-weight:600;vertical-align:top;border:1px solid #e5e5e5}
    table.kv td{padding:4px 8px;border:1px solid #e5e5e5;vertical-align:top}
    table.grid th,table.grid td{padding:4px 6px;border:1px solid #e5e5e5;text-align:left}
    table.grid th{background:#f0f0f0}
    footer{margin-top:24px;border-top:1px solid #ccc;padding-top:6px;font-size:10px;color:#666;text-align:center}
    @media print { body{margin:12mm} .no-print{display:none} }
  </style></head><body>
  <header>
    <div>
      <h1>${escapeHtml(data.title)}</h1>
      ${data.subtitle ? `<div class="meta">${escapeHtml(data.subtitle)}</div>` : ""}
    </div>
    <div class="meta">Emitido em ${today}</div>
  </header>
  ${sectionsHtml}
  ${tablesHtml}
  <footer>Relatório analítico — gerado pelo sistema</footer>
  </body></html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printReport(data: ReportData) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.open();
  w.document.write(buildReportHtml(data));
  w.document.close();
  w.onload = () => {
    setTimeout(() => {
      w.focus();
      w.print();
    }, 200);
  };
}

export function downloadReportPdf(data: ReportData, filename?: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleString("pt-BR");

  // Header
  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text(data.title, 40, 40);
  if (data.subtitle) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(90);
    doc.text(data.subtitle, 40, 56);
  }
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120);
  doc.text(`Emitido em ${today}`, pageW - 40, 40, { align: "right" });
  doc.setDrawColor(0).setLineWidth(1).line(40, 64, pageW - 40, 64);
  doc.setTextColor(0);

  let cursorY = 78;

  for (const s of data.sections) {
    autoTable(doc, {
      startY: cursorY,
      head: [[{ content: s.title.toUpperCase(), colSpan: 2, styles: { fillColor: [30, 30, 30], textColor: 255 } }]],
      body: s.fields.map((f) => [f.label, fmt(f.value)]),
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 160, fontStyle: "bold", fillColor: [245, 245, 245] } },
      theme: "grid",
      margin: { left: 40, right: 40 },
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  for (const t of data.tables ?? []) {
    autoTable(doc, {
      startY: cursorY,
      head: [[{ content: t.title.toUpperCase(), colSpan: t.columns.length, styles: { fillColor: [30, 30, 30], textColor: 255 } }], t.columns],
      body: t.rows.map((r) => r.map((c) => fmt(c))),
      styles: { fontSize: 9, cellPadding: 4 },
      theme: "grid",
      margin: { left: 40, right: 40 },
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Footer with page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8).setTextColor(120);
    doc.text(
      `Página ${i} de ${pages} — Relatório analítico`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  const safe = (filename ?? data.title).replace(/[^a-z0-9-_]+/gi, "_");
  doc.save(`${safe}.pdf`);
}

export const money = (v: number | string | null | undefined) =>
  v == null || v === "" ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const date = (v: string | null | undefined) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("pt-BR");
};

export const datetime = (v: string | null | undefined) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("pt-BR");
};

export const yesno = (v: boolean | null | undefined) => (v ? "Sim" : "Não");
