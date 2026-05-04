// Mock data for the Little Luxuries admin panel.

export const adminUser = {
  name: "Eleanor Vance",
  role: "Store Administrator",
  email: "admin@littleluxuries.com",
};

export const dashboardStats = [
  { label: "Total Orders", value: "1,248", change: "+12%", trend: "up" as const, tone: "lilac" as const },
  { label: "Total Revenue", value: "$42,850.00", change: "+8%", trend: "up" as const, tone: "blush" as const },
  { label: "New Customers", value: "84", change: "+24%", trend: "up" as const, tone: "gold" as const },
  { label: "Low Stock Alerts", value: "5", change: "Needs Restock", trend: "warn" as const, tone: "blush" as const },
];

export const dailySales = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 58 },
  { day: "Wed", value: 35 },
  { day: "Thu", value: 78 },
  { day: "Fri", value: 64 },
  { day: "Sat", value: 95 },
  { day: "Sun", value: 48 },
];

export const topSellers = [
  { name: "Organic Cotton Onesie", collection: "Essentials Collection", sales: 312 },
  { name: "Velvet Sleep Sack", collection: "Nightwear Luxe", sales: 245 },
  { name: "Knitted Bonnet Set", collection: "Handmade Series", sales: 189 },
];

export const recentOrders = [
  { id: "#LL-4590", customer: "Elena Montgomery", initials: "EM", date: "Oct 12, 2023", total: "$124.00", status: "Pending" as const },
  { id: "#LL-4589", customer: "James Dalton", initials: "JD", date: "Oct 11, 2023", total: "$89.50", status: "Shipped" as const },
  { id: "#LL-4588", customer: "Sophia Lane", initials: "SL", date: "Oct 11, 2023", total: "$210.00", status: "Delivered" as const },
  { id: "#LL-4587", customer: "Marcus Chen", initials: "MC", date: "Oct 10, 2023", total: "$45.00", status: "Delivered" as const },
  { id: "#LL-4586", customer: "Avery Monroe", initials: "AM", date: "Oct 10, 2023", total: "$312.50", status: "Shipped" as const },
];

export const inventoryProducts = [
  { sku: "LUX-ONS-001", name: "Organic Cloud Onesie", category: "Onesies", size: "0–12M", price: "$45.00", stock: 42, lowStock: false, status: "Active" as const },
  { sku: "LUX-SLP-024", name: "Silk-Blend Sleepsuit", category: "Sleepwear", size: "3–6M", price: "$78.00", stock: 3, lowStock: true, status: "Active" as const },
  { sku: "LUX-ACC-112", name: "Merino Wool Bonnet", category: "Accessories", size: "NB–6M", price: "$32.00", stock: 120, lowStock: false, status: "Draft" as const },
  { sku: "LUX-SET-009", name: "Petal Swaddle Set", category: "Gift Sets", size: "O/S", price: "$65.00", stock: 18, lowStock: false, status: "Active" as const },
  { sku: "LUX-BOO-051", name: "Cashmere Booties", category: "Accessories", size: "0–6M", price: "$48.00", stock: 27, lowStock: false, status: "Active" as const },
  { sku: "LUX-ONS-077", name: "Linen Sunday Romper", category: "Onesies", size: "6–12M", price: "$58.00", stock: 9, lowStock: true, status: "Active" as const },
];

export const allOrders = [
  { id: "#LL-5001", customer: "Sophia Henderson", initials: "SH", date: "Oct 24, 2023", items: 3, total: "$120.00", payment: "Paid" as const, status: "Pending" as const },
  { id: "#LL-5002", customer: "Marcus Chen", initials: "MC", date: "Oct 23, 2023", items: 1, total: "$45.00", payment: "Paid" as const, status: "Confirmed" as const },
  { id: "#LL-5003", customer: "Alice Miller", initials: "AM", date: "Oct 23, 2023", items: 5, total: "$312.50", payment: "Unpaid" as const, status: "Packed" as const },
  { id: "#LL-5004", customer: "David Wright", initials: "DW", date: "Oct 22, 2023", items: 2, total: "$88.00", payment: "Paid" as const, status: "Shipped" as const },
  { id: "#LL-5005", customer: "Julian Barnes", initials: "JB", date: "Oct 21, 2023", items: 4, total: "$165.20", payment: "Paid" as const, status: "Delivered" as const },
];

export const customers = [
  { name: "Sophia Miller", initials: "SM", email: "sophia.miller@cloudmail.com", orders: 12, pending: 4, spent: "$1,240.50", joined: "Oct 12, 2023", tier: "Gold" as const, color: "blush" as const },
  { name: "Julian West", initials: "JW", email: "j.west.design@studio.io", orders: 2, pending: 0, spent: "$215.00", joined: "Dec 01, 2023", tier: "Standard" as const, color: "lilac" as const },
  { name: "Avery Monroe", initials: "AM", email: "avery.monroe@luxlife.com", orders: 8, pending: 0, spent: "$945.30", joined: "Nov 15, 2023", tier: "Gold" as const, color: "gold" as const },
  { name: "Elena Brooks", initials: "EB", email: "e.brooks@gmail.com", orders: 1, pending: 0, spent: "$89.00", joined: "Jan 04, 2024", tier: "Standard" as const, color: "blush" as const },
  { name: "Marcus Chen", initials: "MC", email: "marcus@chenstudio.com", orders: 6, pending: 1, spent: "$612.40", joined: "Aug 22, 2023", tier: "Standard" as const, color: "lilac" as const },
];

export const coupons = [
  { code: "BABY10", discount: "10%", type: "Percentage Off", redemptions: 452, expires: "Dec 31, 2024", status: "Active" as const },
  { code: "GOLDEN", discount: "$50", type: "Fixed Amount", redemptions: 128, expires: "Sep 15, 2024", status: "Active" as const },
  { code: "SPRING24", discount: "25%", type: "Percentage Off", redemptions: 892, expires: "May 30, 2024", status: "Expired" as const },
  { code: "NEWBORN", discount: "15%", type: "Percentage Off", redemptions: 0, expires: "Sep 01, 2024", status: "Scheduled" as const },
];

export const analyticsKpis = [
  { label: "Total Revenue", value: "$42,850.00", change: "+12.5%", positive: true },
  { label: "Orders", value: "1,240", change: "+8.2%", positive: true },
  { label: "New Customers", value: "458", change: "-2.1%", positive: false },
  { label: "Avg. Order Value", value: "$34.50", change: "+5.4%", positive: true },
];

export const revenueTrend = [
  { month: "JAN", current: 28, previous: 22 },
  { month: "FEB", current: 32, previous: 26 },
  { month: "MAR", current: 38, previous: 30 },
  { month: "APR", current: 64, previous: 42 },
  { month: "MAY", current: 52, previous: 38 },
  { month: "JUN", current: 36, previous: 34 },
  { month: "JUL", current: 72, previous: 48 },
];

export const categoryPerformance = [
  { name: "Premium Onesies", value: "$18.2k", pct: 78, color: "var(--color-primary)" },
  { name: "Silk Accessories", value: "$12.4k", pct: 54, color: "oklch(0.55 0.13 20)" },
  { name: "Knitwear", value: "$9.8k", pct: 42, color: "var(--color-gold)" },
];

export const acquisition = [
  { source: "Organic Search", pct: 60, color: "var(--color-primary)" },
  { source: "Social Media", pct: 25, color: "oklch(0.55 0.13 20)" },
  { source: "Referral", pct: 15, color: "var(--color-gold)" },
];

export const recentReports = [
  { name: "Monthly_Sales_Q3.pdf", meta: "Generated 2 hours ago • 4.2 MB" },
  { name: "Customer_Retention_Aug.csv", meta: "Generated 1 day ago • 1.1 MB" },
  { name: "Inventory_Status_Main.xlsx", meta: "Generated 3 days ago • 2.5 MB" },
];

export const shippingZones = [
  { name: "Domestic (UK)", desc: "Next day & standard delivery across United Kingdom.", info: "Free from £100.00", status: "Active" as const, icon: "globe" as const },
  { name: "European Union", desc: "Standard tracked shipping to all EU member states.", info: "Flat Rate £15.00", status: "Active" as const, icon: "plane" as const },
  { name: "Rest of World", desc: "International airmail and express courier services.", info: "Temporarily Disabled", status: "Paused" as const, icon: "globe" as const },
];
