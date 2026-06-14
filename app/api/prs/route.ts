import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listPRs } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  try {
    const prs = await listPRs(session.accessToken, owner, repo);
    return NextResponse.json(prs);
  } catch {
    return NextResponse.json({ error: "Failed to fetch PRs" }, { status: 502 });
  }
}
