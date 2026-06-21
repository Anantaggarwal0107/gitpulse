import { NextRequest } from "next/server";
import { groqClient } from "@/lib/groq";
import { DEMO_DIFF, DEMO_PR_TITLE } from "@/lib/demo-data";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided PR diff and return a structured review in exactly this format:

## Summary
[1-2 sentence overview of what this PR does]

## Issues Found
[List each issue as: - [SEVERITY] Description (SEVERITY is CRITICAL, WARNING, or INFO)]
[If no issues: - No issues found]

## Suggestions
[List improvement suggestions as bullet points]
[If none: - Looks good!]

## Complexity Score: X/10
[One sentence explaining the score]`;

// No authentication required — this is the public demo endpoint.
export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await groqClient.chat.completions.create({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `PR Title: ${DEMO_PR_TITLE}\n\nDiff:\n\`\`\`diff\n${DEMO_DIFF}\n\`\`\``,
            },
          ],
          stream: true,
          max_tokens: 1500,
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            const sseChunk = `data: ${JSON.stringify({ type: "chunk", content })}\n\n`;
            controller.enqueue(encoder.encode(sseChunk));
          }
        }

        const doneEvent = `data: ${JSON.stringify({ type: "done", score: null })}\n\n`;
        controller.enqueue(encoder.encode(doneEvent));
        controller.close();
      } catch {
        const errEvent = `data: ${JSON.stringify({ type: "error", message: "Stream failed" })}\n\n`;
        controller.enqueue(encoder.encode(errEvent));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
