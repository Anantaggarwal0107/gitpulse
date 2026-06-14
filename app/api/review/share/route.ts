import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await req.json();
  if (!reviewId) {
    return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_public: true })
    .eq("id", reviewId)
    .eq("github_user_id", session.user.githubId);

  if (error) {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
