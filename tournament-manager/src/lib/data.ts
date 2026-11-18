import { context } from "./auth";
import type { Athlete, Category, Registration, Tournament } from "./domain";
export type Club = {
  id: string;
  name: string;
  country: string;
  city: string;
  email: string;
  phone: string;
};
export type Reference = { id: string; name: string; is_active: boolean };
export type Member = { id: string; club_id: string; user_id: string };
export type Data = {
  profile: { id: string; full_name: string; role: "ADMIN" | "COACH" };
  events: Tournament[];
  clubs: Club[];
  athletes: Athlete[];
  categories: Category[];
  registrations: Registration[];
  disciplines: Reference[];
  experience_levels: Reference[];
  club_members: Member[];
  event_disciplines: { id: string; event_id: string; discipline_id: string }[];
  profiles: { id: string; full_name: string }[];
};
export async function loadData(): Promise<Data> {
  const { db, profile } = await context();
  const tables = [
    "events",
    "clubs",
    "athletes",
    "categories",
    "registrations",
    "disciplines",
    "experience_levels",
    "club_members",
    "event_disciplines",
    "profiles",
  ] as const;
  const results = await Promise.all(
    tables.map((table) => db.from(table).select("*").limit(10000)),
  );
  for (let i = 0; i < results.length; i++)
    if (results[i].error) {
      console.error("read_failed", {
        table: tables[i],
        code: results[i].error?.code,
      });
      throw new Error("DATA_UNAVAILABLE");
    }
  return {
    profile,
    ...Object.fromEntries(
      tables.map((table, i) => [table, results[i].data ?? []]),
    ),
  } as Data;
}
