import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

function getAnthropic() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
}

export async function processFinancialQuery(
  userId: string,
  query: string
): Promise<string> {
  const anthropic = getAnthropic();

  // Get recent transactions for context
  const transactions = await db.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100,
  });

  // Calculate some basic stats
  const stats = {
    totalTransactions: transactions.length,
    totalIncome: transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
    totalExpenses: transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
    sources: [...new Set(transactions.map((t) => t.source))],
    dateRange: transactions.length > 0
      ? {
          earliest: transactions[transactions.length - 1].date,
          latest: transactions[0].date,
        }
      : null,
  };

  // Build context for Claude
  const systemPrompt = `You are a financial analyst assistant for Pashoot Reports, a financial reporting tool.
You help small business owners understand their financial data by answering questions in plain English.

The user has ${stats.totalTransactions} transactions in their database from sources: ${stats.sources.join(", ")}.
Total income: $${stats.totalIncome.toFixed(2)}
Total expenses: $${stats.totalExpenses.toFixed(2)}
Net: $${(stats.totalIncome - stats.totalExpenses).toFixed(2)}

Here are the most recent transactions (up to 100):
${transactions.slice(0, 20).map((t) => `- ${t.date.toISOString().split('T')[0]}: ${t.description} - $${t.amount} (${t.type})`).join('\n')}

When answering questions:
1. Be concise and clear
2. Use dollar amounts and specific numbers from the data
3. If you need to calculate something, show your work briefly
4. If the data doesn't contain enough information to answer, say so
5. Format currency with dollar signs and commas (e.g., $1,234.56)

Answer the user's financial question based on their data.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: query,
      },
    ],
  });

  const response = message.content[0].type === "text"
    ? message.content[0].text
    : "I couldn't process that question. Please try rephrasing it.";

  return response;
}

export async function checkChatQuota(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  // Count user messages this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usedThisMonth = await db.chatMessage.count({
    where: {
      userId,
      role: "user",
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  const limit = 20;
  const allowed = usedThisMonth < limit;

  return {
    allowed,
    used: usedThisMonth,
    limit,
  };
}
