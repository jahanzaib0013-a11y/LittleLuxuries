import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, ChevronDown, Table } from "lucide-react";

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  label?: string;
  className?: string;
}

export function ExportMenu({
  onExportCSV,
  onExportPDF,
  label = "Export",
  className,
}: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`rounded-full h-11 px-6 flex items-center gap-2 ${className}`}
        >
          <Download className="h-4 w-4" />
          {label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-(--shadow-card)">
        <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer py-2.5">
          <Table className="h-4 w-4 mr-2 text-emerald-600" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer py-2.5">
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
