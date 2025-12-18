import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, MessageSquare, Cable, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's connections
  const connections = await db.connection.findMany({
    where: { userId: user.id },
  });

  // Get recent reports
  const recentReports = await db.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get subscription
  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
  });

  // Calculate usage stats
  const totalReports = await db.report.count({
    where: { userId: user.id },
  });

  const chatMessages = await db.chatMessage.count({
    where: {
      userId: user.id,
      role: "user",
    },
  });

  const quickActions = [
    {
      title: "Generate Report",
      description: "Create a new financial report",
      icon: FileText,
      href: "/dashboard/reports",
      color: "bg-blue-500",
    },
    {
      title: "Ask AI",
      description: "Query your financial data",
      icon: MessageSquare,
      href: "/dashboard/chat",
      color: "bg-purple-500",
    },
    {
      title: "Connect Source",
      description: "Add a new data source",
      icon: Cable,
      href: "/dashboard/connections",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name || user.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s an overview of your financial reporting
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Sources</CardTitle>
            <Cable className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
            <p className="text-xs text-muted-foreground">
              of 6 available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatMessages}</div>
            <p className="text-xs text-muted-foreground">
              of 20 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{subscription?.status || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              $12/month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Reports</h2>
          <Link href="/dashboard/reports">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
        {recentReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No reports generated yet</p>
              <Link href="/dashboard/reports">
                <Button>Generate Your First Report</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium capitalize">
                      {report.reportType.replace(/_/g, " ")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      report.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : report.status === "generating"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {report.status}
                    </span>
                    {report.status === "completed" && report.pdfUrl && (
                      <Button size="sm" variant="outline">Download</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connected Sources */}
      {connections.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Cable className="w-8 h-8 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">
                  Connect your first data source
                </h3>
                <p className="text-gray-600 mb-4">
                  To generate reports, you need to connect at least one data source like Wave, Stripe, or Xero.
                </p>
                <Link href="/dashboard/connections">
                  <Button>Connect Data Sources</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
