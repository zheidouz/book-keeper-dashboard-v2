import type { FormMatch } from "./types.js";

interface BuildPromptInput {
  userMessage: string;
  history: Array<{ role: string; content: string }>;
  forms: FormMatch[];
  userRole?: string;
}

export function buildPrompt(input: BuildPromptInput) {
  const formContext =
    input.forms.length > 0
      ? input.forms
          .map(
            (f) =>
              `- BIR Form ${f.formCode}: ${f.name} | Frequency: ${f.filingFrequency} | Deadline: Day ${f.deadlineDay}, offset ${f.deadlineMonthOffset} month(s) | Category: ${f.category}`
          )
          .join("\n")
      : "No matching forms found in the database.";

  const systemPrompt = [
    "You are an AI bookkeeping assistant for a Philippine accounting dashboard.",
    "You help bookkeepers with BIR form information and basic accounting Q&A.",
    "",
    "Rules:",
    '- Be concise — 2-3 sentences max unless asked for detail.',
    '- If you don\'t know, say "I\'m not sure — consult a CPA for this."',
    "- Never fabricate BIR form data. Only use the context provided below.",
    "- Never give investment or legal advice.",
    '- Always prefix BIR form codes with "BIR Form " (e.g., "BIR Form 2550M").',
    "",
    "BIR Forms in database (top matches for this query):",
    formContext,
    "",
    `User role: ${input.userRole || "unknown"}`,
    "AI-generated — verify with a qualified professional.",
  ].join("\n");

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
    ...input.history,
    { role: "user", content: input.userMessage },
  ];

  return messages;
}
