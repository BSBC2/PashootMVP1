// Financial Statements
import { generateIncomeStatement } from "./generators/income-statement";
import { generateBalanceSheet } from "./generators/balance-sheet";
import { generateCashFlow } from "./generators/cash-flow";
import { generateTrialBalance } from "./generators/trial-balance";

// Revenue & Sales
import { generateRevenueBreakdown } from "./generators/revenue-breakdown";
import { generateSalesByCustomer } from "./generators/sales-by-customer";
import { generateRevenueTrends } from "./generators/revenue-trends";

// Expenses
import { generateExpenseByCategory } from "./generators/expense-by-category";
import { generateExpenseByVendor } from "./generators/expense-by-vendor";
import { generateTravelEntertainment } from "./generators/travel-entertainment";

// AR & AP
import { generateARAgingReport } from "./generators/ar-aging";
import { generateAPAgingReport } from "./generators/ap-aging";
import { generateCustomerStatement } from "./generators/customer-statement";
import { generateVendorStatement } from "./generators/vendor-statement";

// Tax & Compliance
import { generateContractor1099Report } from "./generators/contractor-1099";
import { generateSalesTaxReport } from "./generators/sales-tax";
import { generateTaxDeductions } from "./generators/tax-deductions";
import { generateQuarterlyTax } from "./generators/quarterly-tax";

// Management
import { generateBudgetVsActual } from "./generators/budget-vs-actual";
import { generateProfitMargin } from "./generators/profit-margin";
import { generateBreakEven } from "./generators/break-even";
import { generateKPIDashboard } from "./generators/kpi-dashboard";

// Reconciliation
import { generateStripeReconciliation } from "./generators/stripe-reconciliation";
import { generateSquareReconciliation } from "./generators/square-reconciliation";
import { generateCrossSourceSummary } from "./generators/cross-source-summary";

// Templates
import { renderIncomeStatementHTML } from "./templates/income-statement";
import { ReportRequest, ReportData } from "./types";

type ReportGenerator = (request: ReportRequest) => Promise<ReportData>;
type ReportRenderer = (data: ReportData) => string;

interface ReportDefinition {
  generator: ReportGenerator;
  renderer: ReportRenderer;
  name: string;
  description: string;
}

export const reportRegistry: Record<string, ReportDefinition> = {
  // Financial Statements (4)
  income_statement: {
    generator: generateIncomeStatement,
    renderer: renderIncomeStatementHTML,
    name: "Income Statement (P&L)",
    description: "Revenue and expenses breakdown with net income",
  },
  balance_sheet: {
    generator: generateBalanceSheet,
    renderer: (data) => renderGenericReport(data),
    name: "Balance Sheet",
    description: "Assets, liabilities, and equity at a point in time",
  },
  cash_flow: {
    generator: generateCashFlow,
    renderer: (data) => renderGenericReport(data),
    name: "Cash Flow Statement",
    description: "Operating, investing, and financing cash flows",
  },
  trial_balance: {
    generator: generateTrialBalance,
    renderer: (data) => renderGenericReport(data),
    name: "Trial Balance",
    description: "Verification that debits equal credits",
  },

  // Revenue & Sales (3)
  revenue_breakdown: {
    generator: generateRevenueBreakdown,
    renderer: (data) => renderGenericReport(data),
    name: "Revenue Breakdown",
    description: "Revenue by category, source, and time period",
  },
  sales_by_customer: {
    generator: generateSalesByCustomer,
    renderer: (data) => renderGenericReport(data),
    name: "Sales by Customer",
    description: "Revenue analysis by customer",
  },
  revenue_trends: {
    generator: generateRevenueTrends,
    renderer: (data) => renderGenericReport(data),
    name: "Revenue Trends",
    description: "Monthly revenue trends and growth rates",
  },

  // Expenses (3)
  expense_by_category: {
    generator: generateExpenseByCategory,
    renderer: (data) => renderGenericReport(data),
    name: "Expense by Category",
    description: "Expenses categorized and analyzed",
  },
  expense_by_vendor: {
    generator: generateExpenseByVendor,
    renderer: (data) => renderGenericReport(data),
    name: "Expense by Vendor",
    description: "Expense analysis by vendor",
  },
  travel_entertainment: {
    generator: generateTravelEntertainment,
    renderer: (data) => renderGenericReport(data),
    name: "Travel & Entertainment",
    description: "T&E expenses for tax deduction tracking",
  },

  // AR & AP (4)
  ar_aging: {
    generator: generateARAgingReport,
    renderer: (data) => renderGenericReport(data),
    name: "AR Aging",
    description: "Accounts receivable aging analysis",
  },
  ap_aging: {
    generator: generateAPAgingReport,
    renderer: (data) => renderGenericReport(data),
    name: "AP Aging",
    description: "Accounts payable aging analysis",
  },
  customer_statement: {
    generator: generateCustomerStatement,
    renderer: (data) => renderGenericReport(data),
    name: "Customer Statement",
    description: "Detailed customer transaction history",
  },
  vendor_statement: {
    generator: generateVendorStatement,
    renderer: (data) => renderGenericReport(data),
    name: "Vendor Statement",
    description: "Detailed vendor transaction history",
  },

  // Tax & Compliance (4)
  contractor_1099: {
    generator: generateContractor1099Report,
    renderer: (data) => renderGenericReport(data),
    name: "1099 Contractor Report",
    description: "Contractor payments for tax reporting",
  },
  sales_tax: {
    generator: generateSalesTaxReport,
    renderer: (data) => renderGenericReport(data),
    name: "Sales Tax Report",
    description: "Sales tax collection and liability",
  },
  tax_deductions: {
    generator: generateTaxDeductions,
    renderer: (data) => renderGenericReport(data),
    name: "Tax Deduction Categorization",
    description: "Categorized deductible expenses for tax filing",
  },
  quarterly_tax: {
    generator: generateQuarterlyTax,
    renderer: (data) => renderGenericReport(data),
    name: "Quarterly Tax Summary",
    description: "Estimated quarterly tax calculations",
  },

  // Management (4)
  budget_vs_actual: {
    generator: generateBudgetVsActual,
    renderer: (data) => renderGenericReport(data),
    name: "Budget vs Actual",
    description: "Compare actual performance against budget",
  },
  profit_margin: {
    generator: generateProfitMargin,
    renderer: (data) => renderGenericReport(data),
    name: "Profit Margin Analysis",
    description: "Gross, operating, and net profit margins",
  },
  break_even: {
    generator: generateBreakEven,
    renderer: (data) => renderGenericReport(data),
    name: "Break-Even Analysis",
    description: "Calculate break-even revenue and units",
  },
  kpi_dashboard: {
    generator: generateKPIDashboard,
    renderer: (data) => renderGenericReport(data),
    name: "KPI Dashboard",
    description: "Key performance indicators and metrics",
  },

  // Reconciliation (3)
  stripe_reconciliation: {
    generator: generateStripeReconciliation,
    renderer: (data) => renderGenericReport(data),
    name: "Stripe Reconciliation",
    description: "Stripe revenue vs accounting reconciliation",
  },
  square_reconciliation: {
    generator: generateSquareReconciliation,
    renderer: (data) => renderGenericReport(data),
    name: "Square Reconciliation",
    description: "Square revenue vs accounting reconciliation",
  },
  cross_source_summary: {
    generator: generateCrossSourceSummary,
    renderer: (data) => renderGenericReport(data),
    name: "Cross-Source Summary",
    description: "Consolidated view across all data sources",
  },
};

// Generic renderer for reports that don't have custom templates
function renderGenericReport(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.reportType}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
        h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        .header { margin-bottom: 30px; }
        .period { color: #6b7280; }
        pre { background: #f9fafb; padding: 20px; border-radius: 8px; overflow-x: auto; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.reportType}</h1>
        <p class="period">Period: ${data.startDate?.split('T')[0]} - ${data.endDate?.split('T')[0]}</p>
      </div>

      <h2>Report Data</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>

      <div class="footer">
        <p>Generated by Pashoot Reports on ${new Date().toLocaleString()}</p>
        <p>Custom template coming soon for this report type.</p>
      </div>
    </body>
    </html>
  `;
}

export function getReportDefinition(reportType: string): ReportDefinition | null {
  return reportRegistry[reportType] || null;
}
