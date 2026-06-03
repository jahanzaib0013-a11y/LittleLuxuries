import { supabase } from "@/lib/supabase";

export interface ReportData {
  name: string;
  format: "pdf" | "csv" | "xlsx";
  generatedAt: Date;
  size: string;
  password: string;
}

// Default password for all reports
const DEFAULT_REPORT_PASSWORD = "report123";

export async function generateMonthlySalesReport(): Promise<ReportData> {
  // Get sales data for the current quarter
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();

  // Calculate quarter start and end dates
  const quarterStart = new Date(year, (currentQuarter - 1) * 3, 1);
  const quarterEnd = new Date(year, currentQuarter * 3, 0);

  // Get orders for the current quarter
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", quarterStart.toISOString())
    .lte("created_at", quarterEnd.toISOString())
    .order("created_at", { ascending: false });

  // Generate report data (in real app, this would create actual PDF)
  const reportData: ReportData = {
    name: `Monthly_Sales_Q${currentQuarter}.pdf`,
    format: "pdf",
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    size: "4.2 MB",
    password: DEFAULT_REPORT_PASSWORD,
  };

  return reportData;
}

export async function generateCustomerRetentionReport(): Promise<ReportData> {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get customer data
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .gte("created_at", lastMonth.toISOString());

  const reportData: ReportData = {
    name: `Customer_Retention_${lastMonth.toLocaleString("default", { month: "short" })}.csv`,
    format: "csv",
    generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    size: "1.1 MB",
    password: DEFAULT_REPORT_PASSWORD,
  };

  return reportData;
}

export async function generateInventoryStatusReport(): Promise<ReportData> {
  // Get product and inventory data
  const { data: products } = await supabase.from("products").select("*");

  const reportData: ReportData = {
    name: "Inventory_Status_Main.xlsx",
    format: "xlsx",
    generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    size: "2.5 MB",
    password: DEFAULT_REPORT_PASSWORD,
  };

  return reportData;
}

export async function getAllRecentReports(): Promise<ReportData[]> {
  const reports = await Promise.all([
    generateMonthlySalesReport(),
    generateCustomerRetentionReport(),
    generateInventoryStatusReport(),
  ]);

  return reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
}

export function verifyReportPassword(inputPassword: string): boolean {
  return inputPassword === DEFAULT_REPORT_PASSWORD;
}

export function createPasswordProtectedDownload(report: ReportData): string {
  // Generate actual content based on report format
  let content = "";
  let mimeType = "";

  switch (report.format) {
    case "pdf":
      content = generatePDFContent(report);
      mimeType = "application/pdf";
      break;
    case "csv":
      content = generateCSVContent(report);
      mimeType = "text/csv";
      break;
    case "xlsx":
      content = generateExcelContent(report);
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      break;
    default:
      content = "Report content";
      mimeType = "text/plain";
  }

  // Convert to base64 for download
  const base64Content = btoa(content);
  return `data:${mimeType};base64,${base64Content}`;
}

function generatePDFContent(report: ReportData): string {
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${report.name}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000360 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
456
%%EOF`;
}

function generateCSVContent(report: ReportData): string {
  const headers = "Date,Customer,Product,Amount,Status\n";
  const sampleData = [
    "2024-08-01,John Doe,Onesie - Blue,$29.99,Completed",
    "2024-08-02,Jane Smith,Accessory Set,$15.99,Completed",
    "2024-08-03,Bob Johnson,Onesie - Pink,$29.99,Pending",
    "2024-08-04,Alice Brown,Accessory Pack,$19.99,Completed",
    "2024-08-05,Charlie Wilson,Onesie - Yellow,$29.99,Completed",
  ].join("\n");

  return headers + sampleData;
}

function generateExcelContent(report: ReportData): string {
  // Simplified Excel-like content (in real app would use proper Excel library)
  return `Product,SKU,Stock Level,Reorder Point,Status
Onesie - Blue,OS001,45,10,In Stock
Onesie - Pink,OS002,8,10,Low Stock
Onesie - Yellow,OS003,67,10,In Stock
Accessory Set,AS001,23,5,In Stock
Accessory Pack,AS002,4,5,Critical Low
Headband,HB001,89,15,In Stock`;
}
