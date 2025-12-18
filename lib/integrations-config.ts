export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: "accounting" | "payments" | "payroll" | "productivity";
  enabled: boolean;
  authUrl?: string;
  scopes?: string[];
  requiredEnvVars: string[];
}

export const integrations: IntegrationConfig[] = [
  {
    id: "wave",
    name: "Wave Accounting",
    description: "Sync transactions, invoices, and customers from Wave",
    logo: "💎",
    category: "accounting",
    enabled: true,
    authUrl: "https://api.waveapps.com/oauth2/authorize/",
    scopes: ["business:read", "business:write"],
    requiredEnvVars: ["WAVE_CLIENT_ID", "WAVE_CLIENT_SECRET"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Import payments, refunds, and customer data",
    logo: "💳",
    category: "payments",
    enabled: true,
    authUrl: "https://connect.stripe.com/oauth/authorize",
    requiredEnvVars: ["STRIPE_CONNECT_CLIENT_ID", "STRIPE_SECRET_KEY"],
  },
  {
    id: "xero",
    name: "Xero",
    description: "Connect bank transactions, invoices, and bills",
    logo: "📊",
    category: "accounting",
    enabled: true,
    authUrl: "https://login.xero.com/identity/connect/authorize",
    scopes: ["accounting.transactions.read", "accounting.contacts.read", "accounting.settings.read"],
    requiredEnvVars: ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET"],
  },
  {
    id: "square",
    name: "Square",
    description: "Sync payments, orders, and customer data",
    logo: "⬛",
    category: "payments",
    enabled: true,
    authUrl: "https://connect.squareup.com/oauth2/authorize",
    requiredEnvVars: ["SQUARE_CLIENT_ID", "SQUARE_CLIENT_SECRET"],
  },
  {
    id: "gusto",
    name: "Gusto",
    description: "Import payroll, contractor payments, and benefits data",
    logo: "👥",
    category: "payroll",
    enabled: true,
    authUrl: "https://api.gusto.com/oauth/authorize",
    scopes: ["companies.read", "payrolls.read", "employees.read", "contractors.read"],
    requiredEnvVars: ["GUSTO_CLIENT_ID", "GUSTO_CLIENT_SECRET"],
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "Import records from your Airtable bases",
    logo: "🔶",
    category: "productivity",
    enabled: true,
    authUrl: "https://airtable.com/oauth2/v1/authorize",
    scopes: ["data.records:read", "schema.bases:read"],
    requiredEnvVars: ["AIRTABLE_CLIENT_ID", "AIRTABLE_CLIENT_SECRET"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync database records for expense tracking",
    logo: "📝",
    category: "productivity",
    enabled: true,
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    requiredEnvVars: ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET"],
  },
];

export function getIntegration(id: string): IntegrationConfig | undefined {
  return integrations.find((integration) => integration.id === id);
}

export function getEnabledIntegrations(): IntegrationConfig[] {
  return integrations.filter((integration) => integration.enabled);
}

export function getIntegrationsByCategory(category: string): IntegrationConfig[] {
  return integrations.filter(
    (integration) => integration.enabled && integration.category === category
  );
}

export function isIntegrationConfigured(integration: IntegrationConfig): boolean {
  return integration.requiredEnvVars.every(
    (envVar) => process.env[envVar] !== undefined && process.env[envVar] !== "placeholder"
  );
}
