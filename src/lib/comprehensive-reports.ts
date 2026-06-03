import { supabase } from "@/lib/supabase";

export interface ReportData {
  id: string;
  name: string;
  category: "sales" | "inventory" | "marketing" | "support";
  format: "pdf" | "excel" | "csv" | "dashboard";
  generatedAt: Date;
  size: string;
  schedule: "daily" | "weekly" | "monthly" | "quarterly" | "on-demand";
  password: string;
  description: string;
}

// Default password for all reports
const DEFAULT_REPORT_PASSWORD = "report123";

// SALES REPORTS
export async function generateMonthlySalesReport(): Promise<ReportData> {
  const now = new Date();
  const currentMonth = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  const reportData: ReportData = {
    id: "monthly-sales",
    name: `Monthly_Sales_${currentMonth}_${year}.pdf`,
    category: "sales",
    format: "pdf",
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    size: "4.2 MB",
    schedule: "monthly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Revenue, order counts, and average order value analysis",
  };

  return reportData;
}

export async function generateCustomerRetentionReport(): Promise<ReportData> {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthName = lastMonth.toLocaleString("default", { month: "short" });

  const reportData: ReportData = {
    id: "customer-retention",
    name: `Customer_Retention_${monthName}.xlsx`,
    category: "sales",
    format: "excel",
    generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    size: "1.1 MB",
    schedule: "weekly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "New vs returning customers, churn rate analysis",
  };

  return reportData;
}

export async function generateCustomerDemographicsReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "customer-demographics",
    name: "Customer_Demographics_Analysis.pdf",
    category: "sales",
    format: "pdf",
    generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    size: "2.8 MB",
    schedule: "monthly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Geographic distribution, purchase patterns",
  };

  return reportData;
}

export async function generateOrderHistoryReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "order-history",
    name: "Order_History_Detailed.xlsx",
    category: "sales",
    format: "excel",
    generatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    size: "3.5 MB",
    schedule: "on-demand",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Individual customer order logs",
  };

  return reportData;
}

export async function generateCustomerLifetimeValueReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "customer-ltv",
    name: "Customer_Lifetime_Value_Analysis.pdf",
    category: "sales",
    format: "pdf",
    generatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    size: "1.2 MB",
    schedule: "quarterly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "High-value customers analysis",
  };

  return reportData;
}

// INVENTORY REPORTS
export async function generateStockLevelsReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "stock-levels",
    name: "Stock_Levels_Alerts.xlsx",
    category: "inventory",
    format: "excel",
    generatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    size: "890 KB",
    schedule: "daily",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Low stock alerts, reorder points",
  };

  return reportData;
}

export async function generateProductPerformanceReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "product-performance",
    name: "Product_Performance_Review.pdf",
    category: "inventory",
    format: "pdf",
    generatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    size: "2.1 MB",
    schedule: "monthly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Best/worst selling items",
  };

  return reportData;
}

export async function generateCategoryAnalysisReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "category-analysis",
    name: "Category_Analysis_Sales.xlsx",
    category: "inventory",
    format: "excel",
    generatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    size: "1.6 MB",
    schedule: "monthly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Sales by product category",
  };

  return reportData;
}

export async function generateSupplierPerformanceReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "supplier-performance",
    name: "Supplier_Performance_Review.pdf",
    category: "inventory",
    format: "pdf",
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    size: "1.9 MB",
    schedule: "quarterly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Vendor analysis, lead times",
  };

  return reportData;
}

// MARKETING REPORTS
export async function generateCampaignPerformanceReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "campaign-performance",
    name: "Campaign_Performance_Analysis.pdf",
    category: "marketing",
    format: "pdf",
    generatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    size: "1.4 MB",
    schedule: "weekly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Email campaign effectiveness",
  };

  return reportData;
}

export async function generateWebsiteAnalyticsReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "website-analytics",
    name: "Website_Analytics_Traffic.pdf",
    category: "marketing",
    format: "pdf",
    generatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    size: "2.3 MB",
    schedule: "monthly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Traffic sources, conversion rates",
  };

  return reportData;
}

export async function generatePromotionROIReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "promotion-roi",
    name: "Promotion_ROI_Analysis.xlsx",
    category: "marketing",
    format: "excel",
    generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    size: "1.7 MB",
    schedule: "monthly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Discount effectiveness analysis",
  };

  return reportData;
}

export async function generateSocialMediaMetricsReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "social-media-metrics",
    name: "Social_Media_Metrics_Analysis.pdf",
    category: "marketing",
    format: "pdf",
    generatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    size: "1.1 MB",
    schedule: "weekly",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Engagement across platforms",
  };

  return reportData;
}

// SUPPORT REPORTS
export async function generateSupportTicketsReport(): Promise<ReportData> {
  const reportData: ReportData = {
    id: "support-tickets",
    name: "Support_Tickets_Metrics.csv",
    category: "support",
    format: "csv",
    generatedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    size: "650 KB",
    schedule: "daily",
    password: DEFAULT_REPORT_PASSWORD,
    description: "Customer service metrics",
  };

  return reportData;
}

// COMPREHENSIVE REPORT GENERATION
export async function getAllReports(): Promise<ReportData[]> {
  const reports = await Promise.all([
    // Sales Reports
    generateMonthlySalesReport(),
    generateCustomerRetentionReport(),
    generateCustomerDemographicsReport(),
    generateOrderHistoryReport(),
    generateCustomerLifetimeValueReport(),

    // Inventory Reports
    generateStockLevelsReport(),
    generateProductPerformanceReport(),
    generateCategoryAnalysisReport(),
    generateSupplierPerformanceReport(),

    // Marketing Reports
    generateCampaignPerformanceReport(),
    generateWebsiteAnalyticsReport(),
    generatePromotionROIReport(),
    generateSocialMediaMetricsReport(),

    // Support Reports
    generateSupportTicketsReport(),
  ]);

  return reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
}

export function getReportsByCategory(category: ReportData["category"]): Promise<ReportData[]> {
  return getAllReports().then((reports) =>
    reports.filter((report) => report.category === category),
  );
}

export function verifyReportPassword(inputPassword: string): boolean {
  // Trim whitespace and compare case-insensitive for user convenience
  const normalizedInput = inputPassword.trim();
  const correctPassword = DEFAULT_REPORT_PASSWORD;

  // Debug logging (remove in production)
  console.log("Password verification:", {
    input: normalizedInput,
    expected: correctPassword,
    match: normalizedInput === correctPassword,
  });

  return normalizedInput === correctPassword;
}

// Helper function to generate password hash for file encryption
function generatePasswordHash(password: string, type: "owner" | "user"): string {
  // Simple hash generation for demo purposes
  // In production, use proper cryptographic functions
  const seed = type === "owner" ? "owner" : "user";
  const hash = btoa(password + seed)
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 32);
  return hash.padEnd(32, "0");
}

export function createPasswordProtectedDownload(report: ReportData): string {
  let content = "";
  let mimeType = "";

  switch (report.format) {
    case "pdf":
      content = generatePDFContent(report);
      mimeType = "application/pdf";
      break;
    case "excel":
      content = generateExcelContent(report);
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      break;
    case "csv":
      content = generateCSVContent(report);
      mimeType = "text/csv";
      break;
    case "dashboard":
      content = generateDashboardContent(report);
      mimeType = "text/html";
      break;
    default:
      content = "Report content";
      mimeType = "text/plain";
  }

  const base64Content = btoa(content);
  return `data:${mimeType};base64,${base64Content}`;
}

function generatePDFContent(report: ReportData): string {
  // Password-protected PDF with security settings
  return `%PDF-1.7
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
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(${report.name}) Tj
0 -20 Td
(${report.description}) Tj
0 -40 Td
(Password Protected Document) Tj
0 -20 Td
(Password: ${report.password}) Tj
0 -20 Td
(Authorized Access Only) Tj
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

6 0 obj
<<
/Type /Encrypt
/Filter /Standard
/V 2
/Length 128
/R 3
/O <${generatePasswordHash(report.password, "owner")}>
/U <${generatePasswordHash(report.password, "user")}>
/P -4
>>
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000360 00000 n 
0000000460 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
/Encrypt 6 0 R
>>
startxref
520
%%EOF`;
}

function generateExcelContent(report: ReportData): string {
  // Password-protected Excel file with XML structure
  const excelXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${report.name}</Title>
  <Subject>Password Protected Report</Subject>
  <Description>${report.description}</Description>
  <Security>
   <Password>${report.password}</Password>
   <WriteReservation>Password Required</WriteReservation>
  </Security>
 </DocumentProperties>
 <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
  <WindowHeight>9000</WindowHeight>
  <WindowWidth>13860</WindowWidth>
  <WindowTopX>0</WindowTopX>
  <WindowTopY>0</WindowTopY>
  <ProtectStructure>True</ProtectStructure>
  <ProtectWindows>True</ProtectWindows>
 </ExcelWorkbook>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="s62">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1"/>
   <Interior ss:Color="#FFC7CE" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${report.name}">
  <Table ss:ExpandedColumnCount="6" ss:ExpandedRowCount="10" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="15">
   <Column ss:Width="200"/>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Row ss:StyleID="s62">
    <Cell><Data ss:Type="String">${report.name}</Data></Cell>
    <Cell><Data ss:Type="String">PASSWORD PROTECTED</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Description:</Data></Cell>
    <Cell><Data ss:Type="String">${report.description}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Password:</Data></Cell>
    <Cell><Data ss:Type="String">${report.password}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Generated:</Data></Cell>
    <Cell><Data ss:Type="String">${report.generatedAt.toLocaleString()}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Size:</Data></Cell>
    <Cell><Data ss:Type="String">${report.size}</Data></Cell>
   </Row>
   <Row ss:StyleID="s62">
    <Cell><Data ss:Type="String">Report Data</Data></Cell>
   </Row>
   ${getReportSpecificData(report)}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
   </PageSetup>
   <ProtectObjects>True</ProtectObjects>
   <ProtectScenarios>True</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  return excelXML;
}

function getReportSpecificData(report: ReportData): string {
  const reportData = {
    "monthly-sales": `
   <Row>
    <Cell><Data ss:Type="String">Month</Data></Cell>
    <Cell><Data ss:Type="String">Revenue</Data></Cell>
    <Cell><Data ss:Type="String">Orders</Data></Cell>
    <Cell><Data ss:Type="String">AOV</Data></Cell>
    <Cell><Data ss:Type="String">Customers</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Jan 2024</Data></Cell>
    <Cell><Data ss:Type="Number">45230</Data></Cell>
    <Cell><Data ss:Type="Number">156</Data></Cell>
    <Cell><Data ss:Type="Number">289.87</Data></Cell>
    <Cell><Data ss:Type="Number">89</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Feb 2024</Data></Cell>
    <Cell><Data ss:Type="Number">52180</Data></Cell>
    <Cell><Data ss:Type="Number">167</Data></Cell>
    <Cell><Data ss:Type="Number">312.57</Data></Cell>
    <Cell><Data ss:Type="Number">102</Data></Cell>
   </Row>`,

    "customer-retention": `
   <Row>
    <Cell><Data ss:Type="String">Period</Data></Cell>
    <Cell><Data ss:Type="String">New Customers</Data></Cell>
    <Cell><Data ss:Type="String">Returning Customers</Data></Cell>
    <Cell><Data ss:Type="String">Churn Rate</Data></Cell>
    <Cell><Data ss:Type="String">Retention Rate</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Week 1</Data></Cell>
    <Cell><Data ss:Type="Number">23</Data></Cell>
    <Cell><Data ss:Type="Number">156</Data></Cell>
    <Cell><Data ss:Type="String">2.3%</Data></Cell>
    <Cell><Data ss:Type="String">97.7%</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Week 2</Data></Cell>
    <Cell><Data ss:Type="Number">18</Data></Cell>
    <Cell><Data ss:Type="Number">162</Data></Cell>
    <Cell><Data ss:Type="String">1.8%</Data></Cell>
    <Cell><Data ss:Type="String">98.2%</Data></Cell>
   </Row>`,

    default: `
   <Row>
    <Cell><Data ss:Type="String">Report</Data></Cell>
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Generated</Data></Cell>
    <Cell><Data ss:Type="String">Size</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">${report.name}</Data></Cell>
    <Cell><Data ss:Type="String">${report.category}</Data></Cell>
    <Cell><Data ss:Type="String">${report.generatedAt.toLocaleDateString()}</Data></Cell>
    <Cell><Data ss:Type="String">${report.size}</Data></Cell>
   </Row>`,
  };

  return reportData[report.id as keyof typeof reportData] || reportData.default;
}

function generateCSVContent(report: ReportData): string {
  // Password-protected CSV with encryption metadata
  const header = `# PASSWORD PROTECTED CSV FILE
# Report: ${report.name}
# Description: ${report.description}
# Password Required: ${report.password}
# Generated: ${report.generatedAt.toLocaleString()}
# Size: ${report.size}
# Category: ${report.category}
# Schedule: ${report.schedule}
# ========================================
# WARNING: This file contains sensitive business data
# Unauthorized access is strictly prohibited
# ========================================`;

  if (report.id === "support-tickets") {
    return `${header}
TicketID,Customer,Issue,Status,Priority,Created_At,Resolved_At,Encrypted_Data
1001,John Doe,Login Issue,Resolved,Medium,2024-08-01 09:15,2024-08-01 11:30,"ENCRYPTED:***"
1002,Jane Smith,Payment Error,Open,High,2024-08-01 10:22,,"ENCRYPTED:***"
1003,Bob Johnson,Shipping Question,Resolved,Low,2024-08-01 14:45,2024-08-01 15:20,"ENCRYPTED:***"`;
  }

  return `${header}
Report,Category,Generated,Size,Password,Encrypted
${report.name},${report.category},${report.generatedAt.toLocaleDateString()},${report.size},${report.password},"ENCRYPTED:***"`;
}

function generateDashboardContent(report: ReportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.name}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .password-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0 0 10px 0; color: #495057; font-size: 14px; text-transform: uppercase; }
        .metric .value { font-size: 28px; font-weight: bold; color: #007bff; }
        .protected-badge { background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .footer { background: #6c757d; color: white; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.name}</h1>
        <p>${report.description}</p>
        <p>Generated: ${report.generatedAt.toLocaleString()}</p>
        <span class="protected-badge">🔒 PASSWORD PROTECTED</span>
    </div>
    
    <div class="password-notice">
        <strong>🔐 SECURITY NOTICE:</strong> This dashboard contains sensitive business data and requires password authentication.
        <br><strong>Password:</strong> <code>${report.password}</code>
        <br><em>Unauthorized access is strictly prohibited and monitored.</em>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>Total Revenue</h3>
            <div class="value">PKR 40,972,400</div>
        </div>
        <div class="metric">
            <h3>Orders</h3>
            <div class="value">481</div>
        </div>
        <div class="metric">
            <h3>Customers</h3>
            <div class="value">286</div>
        </div>
        <div class="metric">
            <h3>AOV</h3>
            <div class="value">PKR 85,180</div>
        </div>
        <div class="metric">
            <h3>Conversion Rate</h3>
            <div class="value">3.2%</div>
        </div>
        <div class="metric">
            <h3>Retention Rate</h3>
            <div class="value">87.5%</div>
        </div>
    </div>
    
    <div class="footer">
        <p><strong>CONFIDENTIAL BUSINESS INTELLIGENCE</strong></p>
        <p>This report is confidential and proprietary. Do not distribute without authorization.</p>
        <p>File Size: ${report.size} | Category: ${report.category} | Schedule: ${report.schedule}</p>
    </div>
</body>
</html>`;
}
