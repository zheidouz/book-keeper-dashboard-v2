import { Router } from "express";
import rateLimit from "express-rate-limit";
import { findRelevantForms } from "../lib/chat/form-retriever.js";
import { buildPrompt } from "../lib/chat/prompt-builder.js";
import { streamFromDeepSeek } from "../lib/chat/deepseek-client.js";
import { writeSSE, writeSSEError } from "../lib/chat/sse-responder.js";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.CHAT_RATE_LIMIT || "30"),
  keyGenerator: (req) => String((req as any).authUser?.id || "anonymous"),
  message: { success: false, error: "Rate limit exceeded. Try again in 2 seconds." },
});

router.post("/", chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Validate history array structure — reject malformed items early
    if (history !== undefined) {
      if (!Array.isArray(history)) {
        return res.status(400).json({ success: false, error: "History must be an array" });
      }
      for (const item of history) {
        if (!item || typeof item.role !== "string" || typeof item.content !== "string") {
          return res.status(400).json({
            success: false,
            error: "Each history item must have a 'role' (string) and 'content' (string)",
          });
        }
      }
    }

    const user = (req as any).authUser;
    const forms = await findRelevantForms(message);
    const messages = buildPrompt({
      userMessage: message.trim().slice(0, 2000),
      history: (history || []).slice(-10),
      forms,
      userRole: user?.role,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    await streamFromDeepSeek(messages, {
      onToken: (token) => writeSSE(res, { token }),
      onDone: (usage) => {
        writeSSE(res, { usage });
        res.end();
      },
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: "Failed to get AI response" });
    }
    writeSSEError(res, err.message || "Internal error");
    res.end();
  }
});

export default router;
