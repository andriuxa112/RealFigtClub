import { z } from "zod";
export const uuid = z.uuid();
export const genders = ["MALE", "FEMALE"] as const;
export const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;
const date = z.iso.date();
export const athleteSchema = z.object({
  club_id: uuid,
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  date_of_birth: date.refine(
    (v) => v <= new Date().toISOString().slice(0, 10),
    "Invalid birth date",
  ),
  gender: z.enum(genders),
});
export const eventSchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    location: z.string().trim().min(2).max(200),
    start_date: date,
    end_date: date,
    registration_deadline: z.iso.datetime({ offset: true }),
    mode: z.enum(["OPEN_RING", "CHAMPIONSHIP"]),
    status: z.enum(["DRAFT", "OPEN", "CLOSED", "FINISHED"]),
    archived: z.boolean().default(false),
  })
  .refine(
    (v) =>
      v.end_date >= v.start_date &&
      v.registration_deadline.slice(0, 10) <= v.start_date,
    "Invalid dates",
  );
export const clubSchema = z.object({
  name: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(1).max(100),
  email: z.email(),
  phone: z.string().trim().max(40),
});
export const categorySchema = z
  .object({
    event_id: uuid,
    discipline_id: uuid,
    name: z.string().trim().min(2).max(120),
    gender: z.enum(genders),
    min_age: z.coerce.number().int().min(0).max(120),
    max_age: z.coerce.number().int().min(0).max(120),
    min_weight: z.coerce.number().min(0).max(500).multipleOf(0.01),
    max_weight: z.coerce.number().positive().max(500).multipleOf(0.01),
    experience_level: uuid,
  })
  .refine(
    (v) => v.min_age <= v.max_age && v.min_weight < v.max_weight,
    "Invalid bounds",
  );
export const registrationSchema = z
  .object({
    event_id: uuid,
    athlete_id: uuid,
    discipline_id: uuid,
    category_id: uuid.nullable(),
    declared_weight: z.coerce.number().positive().max(500).multipleOf(0.01),
    experience_level: uuid,
    total_fights: z.coerce.number().int().min(0).max(10000),
    total_wins: z.coerce.number().int().min(0).max(10000),
    coach_contact: z.string().trim().max(200).default(""),
    notes: z.string().trim().max(1000).default(""),
    status: z.enum(statuses),
  })
  .refine((v) => v.total_wins <= v.total_fights, "Wins exceed fights");
export type Athlete = z.infer<typeof athleteSchema> & { id: string };
export type Category = z.infer<typeof categorySchema> & { id: string };
export type Registration = z.infer<typeof registrationSchema> & { id: string };
export type Tournament = z.infer<typeof eventSchema> & { id: string };
export function ageOn(birth: string, on: string): number {
  const [y, m, d] = birth.split("-").map(Number);
  const [ey, em, ed] = on.split("-").map(Number);
  return ey - y - (em < m || (em === m && ed < d) ? 1 : 0);
}
// Age: inclusive. Weight: (min, max], with zero as the lower floor.
export function eligibleCategories(
  athlete: Pick<Athlete, "date_of_birth" | "gender">,
  registration: Pick<
    Registration,
    "event_id" | "discipline_id" | "declared_weight" | "experience_level"
  >,
  start: string,
  categories: Category[],
) {
  const age = ageOn(athlete.date_of_birth, start);
  return categories.filter(
    (c) =>
      c.event_id === registration.event_id &&
      c.discipline_id === registration.discipline_id &&
      c.gender === athlete.gender &&
      c.experience_level === registration.experience_level &&
      age >= c.min_age &&
      age <= c.max_age &&
      registration.declared_weight > c.min_weight &&
      registration.declared_weight <= c.max_weight,
  );
}
export function canManageClub(role: string, clubIds: string[], clubId: string) {
  return role === "ADMIN" || clubIds.includes(clubId);
}
