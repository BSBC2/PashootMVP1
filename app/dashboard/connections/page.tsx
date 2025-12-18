import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw, Cable } from "lucide-react";

export default async function ConnectionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const connections = await db.connection.findMany({
    where: { userId: user.id },
  });

  const availableSources = [
    {
      id: "wave",
      name: "Wave Accounting",
      description: "Sync transactions, invoices, and customers from Wave",
      logo: "💎",
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Import payments, refunds, and customer data",
      logo: "💳",
    },
    {
      id: "xero",
      name: "Xero",
      description: "Connect bank transactions, invoices, and bills",
      logo: "📊",
    },
    {
      id: "square",
      name: "Square",
      description: "Sync payments, orders, and customer data",
      logo: "⬛",
    },
    {
      id: "airtable",
      name: "Airtable",
      description: "Import records from your Airtable bases",
      logo: "🔶",
    },
    {
      id: "notion",
      name: "Notion",
      description: "Sync database records for expense tracking",
      logo: "📝",
    },
  ];

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

      {/* Available Sources */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableSources.map((source) => {
            const connection = getConnection(source.id);
            const isConnected = !!connection;

            return (
              <Card key={source.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{source.logo}</div>
                      <div>
                        <CardTitle>{source.name}</CardTitle>
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
                        <Button asChild>
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
