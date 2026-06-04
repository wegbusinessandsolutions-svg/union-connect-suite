import { Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadReportPdf, printReport, type ReportData } from "@/lib/report";

type Props = {
  data: ReportData;
  filename?: string;
  size?: "icon" | "sm";
  variant?: "ghost" | "outline";
};

export function ReportActions({ data, filename, size = "icon", variant = "ghost" }: Props) {
  if (size === "icon") {
    return (
      <>
        <Button
          size="icon"
          variant={variant}
          title="Imprimir"
          onClick={(e) => { e.stopPropagation(); printReport(data); }}
        >
          <Printer className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={variant}
          title="Baixar PDF"
          onClick={(e) => { e.stopPropagation(); downloadReportPdf(data, filename); }}
        >
          <FileDown className="h-4 w-4" />
        </Button>
      </>
    );
  }
  return (
    <>
      <Button size="sm" variant={variant} onClick={() => printReport(data)}>
        <Printer className="mr-2 h-4 w-4" /> Imprimir
      </Button>
      <Button size="sm" variant={variant} onClick={() => downloadReportPdf(data, filename)}>
        <FileDown className="mr-2 h-4 w-4" /> PDF
      </Button>
    </>
  );
}
