/**
 * AI Provider abstraction for StockLens.
 *
 * Providers (all but Gemini speak the OpenAI chat-completions format):
 *   - "gemini"     (default) – Google Gemini REST API      GEMINI_API_KEY
 *   - "groq"       – Groq                                   GROQ_API_KEY
 *   - "openrouter" – OpenRouter (many models, some free)    OPENROUTER_API_KEY
 *   - "deepseek"   – DeepSeek                               DEEPSEEK_API_KEY
 *   - "openai"     – OpenAI                                 OPENAI_API_KEY
 *   - "minimax"    – MiniMax                                MINIMAX_API_KEY
 *   - "siray"      – Siray.ai                               SIRAY_API_KEY
 *
 * AI_PROVIDER picks the first provider to try; the rest follow in AI_FALLBACK_ORDER
 * (comma-separated) or the default order below. Providers without a key are skipped,
 * so adding a key is all it takes to add a backup. Each <NAME>_MODEL overrides the model.
 */

export type AIProviderName = "gemini" | "groq" | "openrouter" | "deepseek" | "openai" | "minimax" | "siray";

export interface AIProviderConfig {
  name: AIProviderName;
  apiKey: string;
  baseUrl: string;
  model: string;
}

// Free tiers first, then paid ones, so paid providers are only used when the free ones fail
const DEFAULT_ORDER: AIProviderName[] = ["gemini", "groq", "openrouter", "deepseek", "openai", "minimax", "siray"];

const PROVIDER_NAMES = new Set<string>(DEFAULT_ORDER);

/**
 * Resolve the provider configuration from environment variables.
 */
export function getProviderConfig(
  provider?: AIProviderName
): AIProviderConfig {
  const name =
    provider ||
    (process.env.AI_PROVIDER as AIProviderName) ||
    "gemini";

  switch (name) {
    case "groq":
      return {
        name: "groq",
        apiKey: process.env.GROQ_API_KEY || "",
        baseUrl: "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      };

    case "openrouter":
      return {
        name: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY || "",
        baseUrl: "https://openrouter.ai/api/v1",
        // A free model by default; set OPENROUTER_MODEL for any other (e.g. a paid one)
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      };

    case "deepseek":
      return {
        name: "deepseek",
        apiKey: process.env.DEEPSEEK_API_KEY || "",
        baseUrl: "https://api.deepseek.com/v1",
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      };

    case "openai":
      return {
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY || "",
        baseUrl: "https://api.openai.com/v1",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      };

    case "minimax":
      return {
        name: "minimax",
        apiKey: process.env.MINIMAX_API_KEY || "",
        baseUrl:
          process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1",
        // Defaults to the current MiniMax-M3 model. Set MINIMAX_MODEL to
        // select another model (e.g. the previous MiniMax-M2.7).
        model: process.env.MINIMAX_MODEL || "MiniMax-M3",
      };

    case "siray":
      return {
        name: "siray",
        apiKey: process.env.SIRAY_API_KEY || "",
        baseUrl: "https://api.siray.ai/v1",
        model: "siray-1.0-ultra",
      };

    case "gemini":
    default:
      return {
        name: "gemini",
        apiKey: process.env.GEMINI_API_KEY || "",
        baseUrl:
          "https://generativelanguage.googleapis.com/v1beta/models",
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      };
  }
}

/**
 * The providers to try, in order: AI_PROVIDER first, then AI_FALLBACK_ORDER (or the default
 * order). Only providers with an API key are included.
 */
export function getProviderChain(): AIProviderName[] {
  const primary = (process.env.AI_PROVIDER as AIProviderName) || "gemini";
  const order = (process.env.AI_FALLBACK_ORDER?.split(",").map((p) => p.trim().toLowerCase()) ?? DEFAULT_ORDER)
    .filter((p): p is AIProviderName => PROVIDER_NAMES.has(p));
  return [...new Set([primary, ...order])].filter((name) => getProviderConfig(name).apiKey);
}

// ── Provider call implementations ──────────────────────────────────

// A hung provider would otherwise hold a background job step open until the platform kills it
const AI_TIMEOUT_MS = 30_000;

export class AIProviderError extends Error {
  // Worth retrying later: timeouts, network errors and server errors. Quota (429),
  // auth and bad-request errors won't fix themselves in a few seconds.
  readonly retryable: boolean;

  constructor(message: string, readonly status?: number, retryable?: boolean) {
    super(message);
    this.name = "AIProviderError";
    this.retryable = retryable ?? (status === undefined || status >= 500);
  }
}

// The provider's own reason ("quota exceeded", "model not found"), not just the status code
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = await res.text();
    const message = (JSON.parse(body) as { error?: { message?: string } })?.error?.message;
    return ` - ${(message ?? body).slice(0, 200)}`;
  } catch {
    return "";
  }
}

async function callGemini(
  prompt: string,
  config: AIProviderConfig
): Promise<string> {
  if (!config.apiKey) throw new Error("GEMINI_API_KEY is not set");

  const url = `${config.baseUrl}/${config.model}:generateContent?key=${config.apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new AIProviderError(`Gemini API error: ${res.status} ${res.statusText}${await errorDetail(res)}`, res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new AIProviderError("Gemini returned empty response");
  return text;
}

async function callOpenAICompatible(
  prompt: string,
  config: AIProviderConfig
): Promise<string> {
  if (!config.apiKey) {
    throw new Error(
      `${config.name.toUpperCase()}_API_KEY is not set`
    );
  }

  const url = `${config.baseUrl}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      // OpenRouter uses these to attribute traffic; other providers ignore them
      ...(config.name === "openrouter" ? { "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://stocklense.nextginfosoft.com", "X-Title": "StockLens" } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new AIProviderError(
      `${config.name} API error: ${res.status} ${res.statusText}${await errorDetail(res)}`,
      res.status
    );
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new AIProviderError(`${config.name} returned empty response`);
  }
  return text;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Call the configured (or specified) AI provider and return the model
 * response as a plain string.
 */
export async function callAIProvider(
  prompt: string,
  provider?: AIProviderName
): Promise<string> {
  const config = getProviderConfig(provider);

  if (config.name === "gemini") {
    return callGemini(prompt, config);
  }
  // Every other provider uses an OpenAI-compatible endpoint
  return callOpenAICompatible(prompt, config);
}

/**
 * Try each configured provider in turn (see getProviderChain) and return the first answer.
 * When all fail, the error names every provider's reason and is retryable if any of them was.
 */
export async function callAIProviderWithFallback(
  prompt: string
): Promise<string> {
  const chain = getProviderChain();
  if (chain.length === 0) {
    throw new AIProviderError("No AI provider is configured (set GEMINI_API_KEY, GROQ_API_KEY, ...)", undefined, false);
  }

  const failures: { name: AIProviderName; error: unknown }[] = [];
  for (const name of chain) {
    try {
      return await callAIProvider(prompt, name);
    } catch (error) {
      failures.push({ name, error });
      if (name !== chain[chain.length - 1]) {
        console.error(`⚠️ ${name} failed, trying the next AI provider`, error);
      }
    }
  }

  if (failures.length === 1) throw failures[0].error;
  const retryable = failures.some(({ error }) => !(error instanceof AIProviderError) || error.retryable);
  const summary = failures.map(({ name, error }) => `${name}: ${error instanceof Error ? error.message : String(error)}`).join(" | ");
  throw new AIProviderError(`All AI providers failed. ${summary}`, undefined, retryable);
}

// Whether a failure from callAIProviderWithFallback might succeed if retried shortly
export const isRetryableAIError = (error: unknown) => !(error instanceof AIProviderError) || error.retryable;
