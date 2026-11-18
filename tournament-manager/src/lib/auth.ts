import "server-only";
import { redirect } from "next/navigation";
import { configured, createClient } from "./supabase/server";
export async function context() {
  if (!configured()) redirect("/login?setup=1");
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !profile) redirect("/login?error=profile");
  const { data: members } = await db
    .from("club_members")
    .select("club_id")
    .eq("user_id", user.id);
  return {
    db,
    user,
    profile: profile as {
      id: string;
      full_name: string;
      role: "ADMIN" | "COACH";
    },
    clubIds: (members ?? []).map((m) => m.club_id as string),
  };
}
export async function admin() {
  const ctx = await context();
  if (ctx.profile.role !== "ADMIN") throw new Error("FORBIDDEN");
  return ctx;
}
