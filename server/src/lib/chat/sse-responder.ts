import type { Response } from "express";

export function writeSSE(res: Response, data: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function writeSSEError(res: Response, error: string) {
  res.write(`data: ${JSON.stringify({ error })}\n\n`);
}
