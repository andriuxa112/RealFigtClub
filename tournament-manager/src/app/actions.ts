"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { context } from "@/lib/auth";
import { configured, createClient } from "@/lib/supabase/server";
import {
  athleteSchema,
  clubSchema,
  eventSchema,
  categorySchema,
  registrationSchema,
  uuid,
  canManageClub,
  eligibleCategories,
  type Category,
} from "@/lib/domain";
import type { Message } from "@/lib/i18n";
export async function signIn(form: FormData) {
  if (!configured()) return { error: "Configuration required" as Message };
  const email = z.email().safeParse(form.get("email"));
  const password = z.string().min(1).max(200).safeParse(form.get("password"));
  if (!email.success || !password.success)
    return { error: "Login failed" as Message };
  const db = await createClient();
  const { error } = await db.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });
  if (error) return { error: "Login failed" as Message };
  redirect("/dashboard");
}
export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
  redirect("/login");
}
export type Entity =
  | "events"
  | "clubs"
  | "athletes"
  | "categories"
  | "registrations"
  | "club_members"
  | "event_disciplines"
  | "disciplines"
  | "experience_levels";
export type MutationResult = { ok: boolean; error?: Message };
export async function save(
  entity: Entity,
  raw: unknown,
  id?: string,
): Promise<MutationResult> {
  const { db, profile, clubIds } = await context();
  if (id && !uuid.safeParse(id).success)
    return { ok: false, error: "Invalid data" };
  const schemas = {
    events: eventSchema,
    clubs: clubSchema,
    athletes: athleteSchema,
    categories: categorySchema,
    registrations: registrationSchema,
    club_members: z.object({ club_id: uuid, user_id: uuid }),
    event_disciplines: z.object({ event_id: uuid, discipline_id: uuid }),
    disciplines: z.object({
      name: z.string().trim().min(2).max(80),
      is_active: z.boolean().default(true),
    }),
    experience_levels: z.object({
      name: z.string().trim().min(2).max(80),
      is_active: z.boolean().default(true),
    }),
  };
  if (!Object.hasOwn(schemas, entity))
    return { ok: false, error: "Invalid data" };
  if (
    !["athletes", "registrations"].includes(entity) &&
    profile.role !== "ADMIN"
  )
    return { ok: false, error: "Access denied" };
  const parsed = schemas[entity].safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid data" };
  let payload: Record<string, unknown> = { ...parsed.data };
  if (entity === "athletes") {
    const data = athleteSchema.parse(raw);
    if (!canManageClub(profile.role, clubIds, data.club_id))
      return { ok: false, error: "Access denied" };
    if (id) {
      const { data: old } = await db
        .from("athletes")
        .select("club_id")
        .eq("id", id)
        .single();
      if (!old || !canManageClub(profile.role, clubIds, old.club_id))
        return { ok: false, error: "Access denied" };
    }
  }
  if (entity === "registrations") {
    const r = registrationSchema.parse(raw);
    const [{ data: athlete }, { data: event }, { data: categories }] =
      await Promise.all([
        db.from("athletes").select("*").eq("id", r.athlete_id).single(),
        db.from("events").select("*").eq("id", r.event_id).single(),
        db.from("categories").select("*").eq("event_id", r.event_id),
      ]);
    if (
      !athlete ||
      !event ||
      !canManageClub(profile.role, clubIds, athlete.club_id)
    )
      return { ok: false, error: "Access denied" };
    if (
      profile.role !== "ADMIN" &&
      (event.archived ||
        event.status !== "OPEN" ||
        new Date(event.registration_deadline).getTime() < Date.now())
    )
      return { ok: false, error: "Closed registration" };
    if (profile.role !== "ADMIN" && !["DRAFT", "SUBMITTED"].includes(r.status))
      return { ok: false, error: "Access denied" };
    const eligible = eligibleCategories(
      athlete,
      r,
      event.start_date,
      (categories ?? []) as Category[],
    );
    const selected =
      r.category_id ?? (eligible.length === 1 ? eligible[0].id : null);
    if (
      (selected && !eligible.some((c) => c.id === selected)) ||
      (r.status === "APPROVED" && !selected)
    )
      return { ok: false, error: "Invalid category" };
    payload = { ...r, category_id: selected };
  }
  const query = id
    ? db.from(entity).update(payload).eq("id", id)
    : db.from(entity).insert(payload);
  const { data, error } = await query.select("id");
  if (error) {
    // Log only structural diagnostics, never personal data or raw payloads.
    console.error("mutation_failed", { entity, code: error.code });
    const message: Message =
      error.code === "23505"
        ? "Duplicate"
        : /CATEGORY/.test(error.message)
          ? "Invalid category"
          : /CLOSED/.test(error.message)
            ? "Closed registration"
            : /LOCK|IN_USE|TRANSFER/.test(error.message)
              ? "Locked"
              : "Error";
    return { ok: false, error: message };
  }
  if (!data?.length) return { ok: false, error: "Access denied" };
  revalidatePath("/", "layout");
  return { ok: true };
}
