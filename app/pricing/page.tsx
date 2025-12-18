import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function PricingPage() {
  const features = [
    "25+ professional financial reports",
    "Connect 6 data sources (Wave, Stripe, Xero, Square, Airtable, Notion)",
    "AI chat - ask questions about your finances",
    "Unlimited report generation",
    "PDF export for all reports",
    "Email report delivery",
    "Automatic data synchronization",
    "Tax-ready reports (1099s, sales tax, deductions)",
    "Reconciliation reports",
    "Budget vs actual analysis",
    "Customer and vendor statements",
    "Priority email support",
  ];

  const faqs = [
    {
      question: "Can I cancel anytime?",
      answer: "Yes! Cancel anytime with no penalties or fees. Your subscription will remain active until the end of your billing period.",
    },
    {
      question: "What happens after the 14-day trial?",
      answer: "After your trial ends, you'll be charged $12/month. You can cancel anytime during the trial with no charges.",
    },
    {
      question: "Which data sources do you support?",
      answer: "We support Wave Accounting, Stripe, Xero, Square, Airtable, and Notion. More integrations coming soon!",
    },
    {
      question: "How many reports can I generate?",
      answer: "Unlimited! Generate as many reports as you need. The only limit is 20 AI chat queries per month (with unlimited available on request).",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption and never store your passwords. All connections use OAuth for maximum security.",
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a full refund within 14 days of purchase if you're not satisfied. Just contact support.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8 border-b bg-white/50 backdrop-blur">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Pashoot Reports
          </Link>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            One plan with everything you need. No hidden fees, no surprises.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="border-2 border-primary shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl mb-2">Professional</CardTitle>
              <CardDescription className="text-base">
                Perfect for freelancers and small businesses
              </CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">$12</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                14-day free trial, then billed monthly
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-8">
              <Link href="/signup" className="w-full">
                <Button size="lg" className="w-full text-lg">
                  Start Free Trial
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">
                No credit card required for trial
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Try Pashoot Reports free for 14 days
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
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
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
