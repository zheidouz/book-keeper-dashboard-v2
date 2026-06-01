import OpenAI from "openai";

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  throw new Error(
    "DEEPSEEK_API_KEY environment variable is required. " +
    "Set it in your .env file or Vercel dashboard before starting the server."
  );
}

const client = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey,
});

const MAX_TOKENS = parseInt(process.env.CHAT_MAX_TOKENS || "500");

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (usage: { promptTokens: number; completionTokens: number }) => void;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      // Exponential backoff: 1s, 2s
      await new Promise((r) => setTimeout(r, (i + 1) * 1000));
    }
  }
  throw new Error("unreachable");
}

export async function streamFromDeepSeek(
  messages: Array<{ role: string; content: string }>,
  callbacks: StreamCallbacks
) {
  const stream = await withRetry(() =>
    client.chat.completions.create({
      model: "deepseek-chat",
      messages: messages as any,
      stream: true,
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
    })
  );

  let promptTokens = 0;
  let completionTokens = 0;

  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content;
    if (token) {
      callbacks.onToken(token);
    }
    if (chunk.usage) {
      promptTokens = chunk.usage.prompt_tokens;
      completionTokens = chunk.usage.completion_tokens;
    }
  }

  callbacks.onDone({ promptTokens, completionTokens });

  console.log(
    `[Chat] tokens: ${promptTokens} in / ${completionTokens} out | model: deepseek-chat`
  );
}
