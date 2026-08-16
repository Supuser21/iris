import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { runSavedWorkflow } from "@/lib/agent/workflows";
import { ensureDb } from "@/lib/init";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await runSavedWorkflow({
    userId: session.userId,
    workflowId: id,
    jobQuery: typeof body.jobQuery === "string" ? body.jobQuery : undefined,
  });

  if (!result.ok && !("workflow" in result)) {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }
  return NextResponse.json(result);
}
