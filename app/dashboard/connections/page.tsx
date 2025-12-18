import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw, Cable, AlertCircle } from "lucide-react";
import { getEnabledIntegrations, isIntegrationConfigured } from "@/lib/integrations-config";

export default async function ConnectionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const connections = await db.connection.findMany({
    where: { userId: user.id },
  });

  // Get integrations dynamically from config
  const availableSources = getEnabledIntegrations();

  const getConnection = (sourceId: string) => {
    return connections.find((c) => c.source === sourceId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Connections</h1>
        <p className="text-gray-600 mt-2">
          Connect your financial data sources to generate reports
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Cable className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
            <p className="text-xs text-muted-foreground">
              of {availableSources.length} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections.length > 0 && connections[0].lastSyncAt
                ? new Date(connections[0].lastSyncAt).toLocaleString()
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {await db.transaction.count({ where: { userId: user.id } })}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions synced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Sources - Grouped by Category */}
      <div className="space-y-8">
        {["accounting", "payments", "payroll", "productivity"].map((category) => {
          const categorySources = availableSources.filter(s => s.category === category);
          if (categorySources.length === 0) return null;

          const categoryNames: Record<string, string> = {
            accounting: "Accounting Software",
            payments: "Payment Processors",
            payroll: "Payroll & HR",
            productivity: "Productivity Tools",
          };

          return (
            <div key={category}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {categoryNames[category]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categorySources.map((source) => {
                  const connection = getConnection(source.id);
                  const isConnected = !!connection;
                  const isConfigured = isIntegrationConfigured(source);

                  return (
                    <Card key={source.id} className={!isConfigured ? "opacity-60" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-4xl">{source.logo}</div>
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {source.name}
                                {!isConfigured && (
                                  <AlertCircle className="w-4 h-4 text-amber-500" />
                                )}
                              </CardTitle>
                              <CardDescription>{source.description}</CardDescription>
                            </div>
                          </div>
                          {isConnected ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {!isConfigured && (
                            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                              Configuration required in environment variables
                            </div>
                          )}
                          {isConnected && connection && (
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                Connected on {new Date(connection.createdAt).toLocaleDateString()}
                              </p>
                              <p>
                                Last synced: {connection.lastSyncAt
                                  ? new Date(connection.lastSyncAt).toLocaleString()
                                  : "Never"}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {isConnected ? (
                              <>
                                <form action={`/api/sync/${source.id}`} method="POST">
                                  <Button type="submit" variant="outline" size="sm">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Sync Now
                                  </Button>
                                </form>
                                <Button variant="destructive" size="sm">
                                  Disconnect
                                </Button>
                              </>
                            ) : (
                              <Button asChild disabled={!isConfigured}>
                                <a href={`/api/connect/${source.id}`}>
                                  Connect {source.name}
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-2">Need help connecting?</h3>
          <p className="text-gray-600 mb-4">
            Each connection uses OAuth for secure access. You&apos;ll be redirected to authorize
            Pashoot Reports to read your financial data. We never store your passwords.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• All connections are encrypted and secure</li>
            <li>• You can disconnect at any time</li>
            <li>• We only read data, never modify it</li>
            <li>• Syncs happen automatically once per day</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
