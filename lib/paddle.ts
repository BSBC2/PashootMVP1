import { Paddle, Environment } from "@paddle/paddle-node-sdk";

// Lazy-load Paddle client to avoid build-time initialization
function getPaddle() {
  const apiKey = process.env.PADDLE_API_KEY;
  const environment = process.env.PADDLE_ENVIRONMENT as "sandbox" | "production" || "sandbox";

  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is not defined");
  }

  return new Paddle(apiKey, {
    environment: environment === "production" ? Environment.production : Environment.sandbox,
  });
}

export { getPaddle };
