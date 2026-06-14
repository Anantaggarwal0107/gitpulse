import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listRepos } from "@/lib/github";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = await listRepos(session.accessToken);
    return NextResponse.json(repos);
  } catch {
    return NextResponse.json({ error: "Failed to fetch repos" }, { status: 502 });
  }
}
