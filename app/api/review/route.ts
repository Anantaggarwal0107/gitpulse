import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPRDiff } from "@/lib/github";
import { groqClient } from "@/lib/groq";
import { createServerClient } from "@/lib/supabase/server";

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { owner, repo, prNumber, prTitle, prUrl } = body as {
    owner: string;
    repo: string;
    prNumber: number;
    prTitle: string;
    prUrl: string;
  };

  if (!owner || !repo || !prNumber) {
    return new Response("Missing required fields", { status: 400 });
  }

  let diff: string;
  try {
    diff = await getPRDiff(session.accessToken, owner, repo, prNumber);
  } catch {
    return new Response("Failed to fetch PR diff", { status: 502 });
  }

  const MAX_DIFF_CHARS = 8000;
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + "\n...[diff truncated]";
  }

  const encoder = new TextEncoder();
  let fullReviewText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await groqClient.chat.completions.create({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `PR Title: ${prTitle}\n\nDiff:\n\`\`\`diff\n${diff}\n\`\`\``,
            },
          ],
          stream: true,
          max_tokens: 1500,
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            fullReviewText += content;
            const sseChunk = `data: ${JSON.stringify({ type: "chunk", content })}\n\n`;
            controller.enqueue(encoder.encode(sseChunk));
          }
        }

        const scoreMatch = fullReviewText.match(/Complexity Score:\s*(\d+)\s*\/\s*10/i);
        const complexityScore = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

        const supabase = createServerClient();
        const { data: savedReview, error } = await supabase
          .from("reviews")
          .insert({
            github_user_id: session.user.githubId,
            pr_url: prUrl,
            repo_full_name: `${owner}/${repo}`,
            pr_number: prNumber,
            pr_title: prTitle,
            review_text: fullReviewText,
            complexity_score: complexityScore,
            is_public: false,
          })
          .select("id")
          .single();

        const reviewId = error ? null : savedReview?.id;

        const doneEvent = `data: ${JSON.stringify({
          type: "done",
          reviewId,
          score: complexityScore,
        })}\n\n`;
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
