import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Zap, Shield, DollarSign, BarChart } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: FileText,
      title: "25+ Professional Reports",
      description: "Income statements, cash flow, tax reports, and more - all generated automatically",
    },
    {
      icon: TrendingUp,
      title: "AI-Powered Insights",
      description: "Ask questions about your finances in plain English and get instant answers",
    },
    {
      icon: Zap,
      title: "Multiple Integrations",
      description: "Connect Wave, Stripe, Xero, Square, Airtable, and Notion in one place",
    },
    {
      icon: Shield,
      title: "Tax-Ready Reports",
      description: "1099 tracking, expense categorization, and sales tax reports built-in",
    },
    {
      icon: DollarSign,
      title: "Simple Pricing",
      description: "Just $12/month with a 14-day free trial. No hidden fees.",
    },
    {
      icon: BarChart,
      title: "Export & Share",
      description: "PDF exports and email delivery for easy sharing with your accountant",
    },
  ];

  const reportCategories = [
    {
      name: "Financial Statements",
      count: 4,
      examples: ["Income Statement (P&L)", "Balance Sheet", "Cash Flow Statement", "Trial Balance"],
    },
    {
      name: "Revenue & Sales",
      count: 3,
      examples: ["Revenue Breakdown", "Sales by Customer", "Revenue Trends"],
    },
    {
      name: "Expenses",
      count: 3,
      examples: ["Expense by Category", "Expense by Vendor", "Travel & Entertainment"],
    },
    {
      name: "AR & AP",
      count: 4,
      examples: ["AR Aging", "AP Aging", "Customer Statement", "Vendor Statement"],
    },
    {
      name: "Tax & Compliance",
      count: 4,
      examples: ["1099 Contractor Report", "Sales Tax Report", "Tax Deduction Categorization"],
    },
    {
      name: "Management",
      count: 4,
      examples: ["Budget vs Actual", "Profit Margin Analysis", "Break-Even Analysis"],
    },
    {
      name: "Reconciliation",
      count: 3,
      examples: ["Stripe Reconciliation", "Square Reconciliation", "Cross-Source Summary"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple Financial Reports for Small Business
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered financial reporting that connects to your data sources and generates professional reports automatically
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Reports Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">25+ Reports Included</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          From basic financial statements to advanced tax reports, we&apos;ve got you covered
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {category.name}
                  <span className="text-sm font-normal text-muted-foreground">
                    {category.count} reports
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.examples.map((example, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-primary mr-2">•</span>
                      {example}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to simplify your finances?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of small businesses using Pashoot Reports
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">
              © 2025 Pashoot Reports. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
