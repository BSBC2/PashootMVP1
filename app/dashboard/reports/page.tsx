import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const reportCategories = [
    {
      name: "Financial Statements",
      description: "Core financial reports for your business",
      reports: [
        { id: "income_statement", name: "Income Statement (P&L)", description: "Revenue and expenses breakdown" },
        { id: "balance_sheet", name: "Balance Sheet", description: "Assets, liabilities, and equity" },
        { id: "cash_flow", name: "Cash Flow Statement", description: "Cash inflows and outflows" },
        { id: "trial_balance", name: "Trial Balance", description: "All accounts with debits and credits" },
      ],
    },
    {
      name: "Revenue & Sales",
      description: "Understand your income sources",
      reports: [
        { id: "revenue_breakdown", name: "Revenue Breakdown", description: "Revenue by category and source" },
        { id: "sales_by_customer", name: "Sales by Customer", description: "Top customers and lifetime value" },
        { id: "revenue_trends", name: "Revenue Trends", description: "Growth patterns and seasonality" },
      ],
    },
    {
      name: "Expenses",
      description: "Track and categorize your spending",
      reports: [
        { id: "expense_by_category", name: "Expense by Category", description: "Business expenses categorized" },
        { id: "expense_by_vendor", name: "Expense by Vendor", description: "Spending per vendor" },
        { id: "travel_entertainment", name: "Travel & Entertainment", description: "T&E expenses for tax deduction" },
      ],
    },
    {
      name: "Accounts Receivable & Payable",
      description: "Manage what you owe and are owed",
      reports: [
        { id: "ar_aging", name: "AR Aging Report", description: "Who owes you money" },
        { id: "ap_aging", name: "AP Aging Report", description: "Who you owe" },
        { id: "customer_statement", name: "Customer Statement", description: "Individual customer balance" },
        { id: "vendor_statement", name: "Vendor Statement", description: "Individual vendor balance" },
      ],
    },
    {
      name: "Tax & Compliance",
      description: "Tax-ready reports for year-end",
      reports: [
        { id: "1099_contractor", name: "1099 Contractor Report", description: "Contractor payments tracking" },
        { id: "sales_tax", name: "Sales Tax Report", description: "Tax collected by jurisdiction" },
        { id: "tax_categorization", name: "Tax Deduction Categorization", description: "IRS expense categories" },
        { id: "depreciation", name: "Depreciation Schedule", description: "Asset depreciation tracking" },
      ],
    },
    {
      name: "Management Reports",
      description: "Business performance analytics",
      reports: [
        { id: "budget_vs_actual", name: "Budget vs Actual", description: "Planned vs actual spending" },
        { id: "profit_margin", name: "Profit Margin Analysis", description: "Margin by product/service" },
        { id: "break_even", name: "Break-Even Analysis", description: "Break-even point calculation" },
        { id: "bank_reconciliation", name: "Bank Reconciliation", description: "Bank vs books comparison" },
      ],
    },
    {
      name: "Reconciliation",
      description: "Match data across platforms",
      reports: [
        { id: "stripe_reconciliation", name: "Stripe Reconciliation", description: "Stripe vs accounting match" },
        { id: "square_reconciliation", name: "Square Reconciliation", description: "Square vs accounting match" },
        { id: "cross_source", name: "Cross-Source Summary", description: "Combined view of all sources" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">
            Generate professional financial reports from your data
          </p>
        </div>
      </div>

      {/* Report Categories */}
      <div className="space-y-8">
        {reportCategories.map((category) => (
          <div key={category.name}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{report.name}</CardTitle>
                        <CardDescription className="text-sm">{report.description}</CardDescription>
                      </div>
                      <FileText className="w-5 h-5 text-gray-400 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Generate Report</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-2">How to generate reports</h3>
          <p className="text-gray-600 mb-4">
            Click &quot;Generate Report&quot; on any report to select a date range and create your report.
            All reports can be exported as PDF and emailed to your accountant.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Reports are generated in seconds</li>
            <li>• You can generate unlimited reports</li>
            <li>• All reports are saved for future reference</li>
            <li>• PDF exports are included</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
