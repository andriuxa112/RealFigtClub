"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Shield,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { save, signOut, type Entity } from "@/app/actions";
import {
  ageOn,
  eligibleCategories,
  type Athlete,
  type Category,
  type Registration,
} from "@/lib/domain";
import type { Data } from "@/lib/data";
import type { Message } from "@/lib/i18n";
import { LanguagePicker, useLanguage } from "./language";

type Row = Record<string, unknown>;
type Choice = { value: string; label: string };
type Field = {
  key: string;
  label: Message;
  type?: string;
  options?: Choice[];
  min?: number;
  max?: number;
  step?: string;
  optional?: boolean;
};
type Editor = {
  entity: Entity;
  title: Message;
  fields: Field[];
  initial: Row;
  id?: string;
};
const navigation = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["tournaments", "Tournaments", Trophy],
  ["clubs", "Clubs", Shield],
  ["athletes", "Athletes", Users],
  ["matchmaking", "Matchmaking", Swords],
  ["schedule", "Schedule", CalendarDays],
] as const;
export function Workspace({ data, path }: { data: Data; path: string[] }) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [registration, setRegistration] = useState<
    Registration | null | undefined
  >(undefined);
  const [notice, setNotice] = useState<{
    key: Message;
    error?: boolean;
  } | null>(null);
  const [pending, start] = useTransition();
  const admin = data.profile.role === "ADMIN";
  const section = path[0];
  const id = path[1];
  const event = data.events.find((e) => e.id === id);
  const club = data.clubs.find((c) => c.id === id);
  const athlete = data.athletes.find((a) => a.id === id);
  const tab = path[2] ?? "overview";
  const choices = (keys: Message[]) =>
    keys.map((key) => ({ value: key, label: t(key) }));
  const refs = (items: { id: string; name: string }[]) =>
    items.map((v) => ({ value: v.id, label: v.name }));
  function edit(
    entity: Entity,
    title: Message,
    fields: Field[],
    initial: object = {},
    editId?: string,
  ) {
    setNotice(null);
    setEditor({ entity, title, fields, initial: initial as Row, id: editId });
  }
  const eventFields: Field[] = [
    { key: "name", label: "Name" },
    { key: "location", label: "Location" },
    { key: "start_date", label: "Start date", type: "date" },
    { key: "end_date", label: "End date", type: "date" },
    {
      key: "registration_deadline",
      label: "Registration deadline",
      type: "datetime-local",
    },
    {
      key: "mode",
      label: "Mode",
      options: choices(["OPEN_RING", "CHAMPIONSHIP"]),
    },
    {
      key: "status",
      label: "Status",
      options: choices(["DRAFT", "OPEN", "CLOSED", "FINISHED"]),
    },
  ];
  const clubFields: Field[] = [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel", optional: true },
  ];
  const athleteFields: Field[] = [
    { key: "first_name", label: "First name" },
    { key: "last_name", label: "Last name" },
    { key: "date_of_birth", label: "Date of birth", type: "date" },
    { key: "gender", label: "Gender", options: choices(["MALE", "FEMALE"]) },
    { key: "club_id", label: "Club", options: refs(data.clubs) },
  ];
  const eventDisciplines = event
    ? data.disciplines.filter((d) =>
        data.event_disciplines.some(
          (ed) => ed.event_id === event.id && ed.discipline_id === d.id,
        ),
      )
    : [];
  const categoryFields: Field[] = [
    { key: "name", label: "Name" },
    {
      key: "discipline_id",
      label: "Discipline",
      options: refs(eventDisciplines),
    },
    { key: "gender", label: "Gender", options: choices(["MALE", "FEMALE"]) },
    { key: "min_age", label: "Min age", type: "number", min: 0, max: 120 },
    { key: "max_age", label: "Max age", type: "number", min: 0, max: 120 },
    {
      key: "min_weight",
      label: "Min weight",
      type: "number",
      min: 0,
      max: 500,
      step: "0.01",
    },
    {
      key: "max_weight",
      label: "Max weight",
      type: "number",
      min: 0.01,
      max: 500,
      step: "0.01",
    },
    {
      key: "experience_level",
      label: "Experience",
      options: refs(data.experience_levels),
    },
  ];
  function result(ok: boolean, error?: Message) {
    setNotice({ key: ok ? "Saved" : (error ?? "Error"), error: !ok });
    if (ok) {
      setEditor(null);
      setRegistration(undefined);
      router.refresh();
    }
  }
  function mutate(entity: Entity, payload: unknown, editId?: string) {
    start(async () => {
      try {
        const r = await save(entity, payload, editId);
        result(r.ok, r.error);
      } catch {
        result(false);
      }
    });
  }
  function eventEditor() {
    edit(
      "events",
      event ? "Edit" : "New tournament",
      eventFields,
      event
        ? {
            ...event,
            registration_deadline: localDateTime(event.registration_deadline),
          }
        : { mode: "OPEN_RING", status: "DRAFT" },
      event?.id,
    );
  }
  function athleteEditor(a?: Athlete) {
    edit(
      "athletes",
      a ? "Edit" : "New athlete",
      athleteFields,
      a ?? { club_id: club?.id ?? data.clubs[0]?.id, gender: "MALE" },
      a?.id,
    );
  }
  const title: Message =
    section === "tournaments"
      ? "Tournaments"
      : section === "clubs"
        ? "Clubs"
        : section === "athletes"
          ? "Athletes"
          : section === "matchmaking"
            ? "Matchmaking"
            : section === "schedule"
              ? "Schedule"
              : "Dashboard";
  const match = (row: object) =>
    Object.values(row).some((v) =>
      String(v).toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    );
  function tools(extra?: ReactNode) {
    return (
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label={t("Search")}
            placeholder={t("Search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {extra}
      </div>
    );
  }
  function table(headers: Message[], rows: ReactNode[][]) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((cells, i) => (
                <tr key={i}>
                  {cells.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="empty">
                  {t("No records")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
  const badge = (value: string) => (
    <span className={`badge ${value.toLowerCase()}`}>
      {t(value as Message)}
    </span>
  );
  const editButton = (onClick: () => void) => (
    <button className="quiet" onClick={onClick}>
      {t("Edit")} <ChevronRight size={14} />
    </button>
  );
  const button = (text: Message, onClick: () => void) => (
    <button className="primary" onClick={onClick}>
      <Plus size={16} />
      {t(text)}
    </button>
  );
  const clubName = (cid: string) =>
    data.clubs.find((c) => c.id === cid)?.name ?? "—";
  const disciplineName = (did: string) =>
    data.disciplines.find((d) => d.id === did)?.name ?? "—";
  const experienceName = (xid: string) =>
    data.experience_levels.find((x) => x.id === xid)?.name ?? "—";
  function tournamentTable() {
    return table(
      ["Name", "Mode", "Start date", "Location", "Status", "Manage"],
      data.events
        .filter(
          (e) =>
            match(e) &&
            (!filter ||
              (filter === "archived"
                ? e.archived
                : e.status === filter && !e.archived)),
        )
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .map((e) => [
          <Link key="name" className="row-title" href={`/tournaments/${e.id}`}>
            <span className="table-icon">
              <Trophy size={18} />
            </span>
            {e.name}
          </Link>,
          badge(e.mode),
          e.start_date,
          e.location,
          e.archived ? badge("Archived") : badge(e.status),
          <Link key="go" className="quiet" href={`/tournaments/${e.id}`}>
            {t("View")} <ArrowUpRight size={15} />
          </Link>,
        ]),
    );
  }
  const canRegister =
    event &&
    !event.archived &&
    event.status === "OPEN" &&
    new Date(event.registration_deadline).getTime() > Date.now();
  const createPage = id === "new";
  const pageForm =
    createPage && (section === "tournaments" || section === "athletes");
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "visible" : ""}`}>
        <Link href="/dashboard" className="brand">
          REAL<span>FIGHT</span>
          <small>TOURNAMENT MANAGER</small>
        </Link>
        <div className="nav-caption">{t("Administration")}</div>
        <nav>
          {navigation.map(([href, name, Icon]) => (
            <Link
              onClick={() => setMobile(false)}
              className={section === href ? "active" : ""}
              href={`/${href}`}
              key={href}
            >
              <Icon size={19} />
              {t(name)}
              {["matchmaking", "schedule"].includes(href) && (
                <span className="phase">II</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">
            {(data.profile.full_name || "RF").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong>{data.profile.full_name || "REAL FIGHT"}</strong>
            <small>{t(admin ? "Admin" : "Coach")}</small>
          </div>
          <button
            aria-label={t("Sign out")}
            onClick={() => start(() => signOut())}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          aria-label={t("Close")}
          className="scrim"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-toggle"
              aria-label="Menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={22} />
            </button>
            <span>REAL FIGHT</span>
            <ChevronRight size={14} />
            <strong>{t(title)}</strong>
          </div>
          <div className="top-right">
            <span className="system-indicator">
              <i /> TOURNAMENT MANAGER
            </span>
            <LanguagePicker />
          </div>
        </header>
        <main className="workspace">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                REAL FIGHT / {section.toUpperCase()}
              </span>
              <h1>
                {event?.name ??
                  club?.name ??
                  (athlete
                    ? `${athlete.first_name} ${athlete.last_name}`
                    : t(section === "dashboard" ? "Welcome" : title))}
              </h1>
              <p>
                {section === "dashboard"
                  ? t("Dashboard description")
                  : event
                    ? `${event.location} · ${event.start_date} — ${event.end_date}`
                    : null}
              </p>
            </div>
            <div className="heading-actions">
              {section === "tournaments" &&
                !pageForm &&
                admin &&
                button(event ? "Edit" : "New tournament", eventEditor)}
              {section === "clubs" &&
                admin &&
                button(club ? "Edit" : "New club", () =>
                  edit(
                    "clubs",
                    club ? "Edit" : "New club",
                    clubFields,
                    club ?? {},
                    club?.id,
                  ),
                )}
              {section === "athletes" &&
                !pageForm &&
                button(athlete ? "Edit" : "New athlete", () =>
                  athleteEditor(athlete),
                )}
            </div>
          </div>
          {notice && (
            <div
              role={notice.error ? "alert" : "status"}
              className={`notice ${notice.error ? "error" : "success"}`}
            >
              <span>{t(notice.key)}</span>
              <button aria-label={t("Close")} onClick={() => setNotice(null)}>
                <X size={16} />
              </button>
            </div>
          )}
          {section === "dashboard" && (
            <>
              <div className="stats">
                {[
                  [
                    Trophy,
                    "Active tournaments",
                    data.events.filter(
                      (e) => e.status === "OPEN" && !e.archived,
                    ).length,
                  ],
                  [Users, "Registered athletes", data.athletes.length],
                  [
                    Clock3,
                    "Pending approval",
                    data.registrations.filter((r) => r.status === "SUBMITTED")
                      .length,
                  ],
                  [Shield, "Clubs", data.clubs.length],
                ].map(([Icon, text, count], i) => {
                  const StatIcon = Icon as typeof Trophy;
                  return (
                    <div className="stat" key={i}>
                      <div className="stat-top">
                        <span>{t(text as Message)}</span>
                        <StatIcon size={20} />
                      </div>
                      <strong>{String(count).padStart(2, "0")}</strong>
                      <div className="stat-line" />
                    </div>
                  );
                })}
              </div>
              <div className="section-heading">
                <h2>{t("Upcoming tournaments")}</h2>
                <Link href="/tournaments">
                  {t("Tournaments")} <ArrowUpRight size={16} />
                </Link>
              </div>
              {tournamentTable()}
              <div className="info-grid">
                <div className="info-card">
                  <Activity />
                  <h3>{t("Registration rules")}</h3>
                  <p>{t("Bounds description")}</p>
                </div>
                <div className="info-card">
                  <Swords />
                  <h3>{t("Coming soon")}</h3>
                  <p>{t("Phase two")}</p>
                </div>
              </div>
            </>
          )}
          {pageForm && (section !== "tournaments" || admin) ? (
            <section className="panel">
              <h2>
                {t(
                  section === "tournaments" ? "New tournament" : "New athlete",
                )}
              </h2>
              <GenericForm
                key={section}
                fields={section === "tournaments" ? eventFields : athleteFields}
                initial={
                  section === "tournaments"
                    ? { mode: "OPEN_RING", status: "DRAFT" }
                    : { gender: "MALE", club_id: data.clubs[0]?.id }
                }
                pending={pending}
                onCancel={() => router.push(`/${section}`)}
                onSubmit={(values) =>
                  mutate(
                    section === "tournaments" ? "events" : "athletes",
                    values,
                  )
                }
              />
            </section>
          ) : pageForm ? (
            <p>{t("Access denied")}</p>
          ) : null}
          {section === "tournaments" && !id && (
            <>
              {tools(
                <select
                  aria-label={t("Status")}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="">{t("All statuses")}</option>
                  {["DRAFT", "OPEN", "CLOSED", "FINISHED"].map((s) => (
                    <option key={s} value={s}>
                      {t(s as Message)}
                    </option>
                  ))}
                  <option value="archived">{t("Archived")}</option>
                </select>,
              )}
              {tournamentTable()}
            </>
          )}
          {event && (
            <>
              <div className="tabs">
                {[
                  ["overview", "Overview"],
                  ["registrations", "Registrations"],
                  ["categories", "Categories"],
                ].map(([slug, text]) => (
                  <Link
                    key={slug}
                    className={tab === slug ? "active" : ""}
                    href={`/tournaments/${event.id}${slug === "overview" ? "" : `/${slug}`}`}
                  >
                    {t(text as Message)}
                    {slug === "registrations" && (
                      <span>
                        {
                          data.registrations.filter(
                            (r) => r.event_id === event.id,
                          ).length
                        }
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              {tab === "overview" && (
                <>
                  <div className="detail-grid">
                    <section className="panel">
                      <h2>{t("Overview")}</h2>
                      <dl>
                        {(
                          [
                            ["Mode", t(event.mode)],
                            ["Status", t(event.status)],
                            [
                              "Registration deadline",
                              new Intl.DateTimeFormat(locale, {
                                dateStyle: "medium",
                                timeStyle: "short",
                                timeZone: "Europe/Vilnius",
                              }).format(new Date(event.registration_deadline)),
                            ],
                            [
                              "Registrations",
                              String(
                                data.registrations.filter(
                                  (r) => r.event_id === event.id,
                                ).length,
                              ),
                            ],
                          ] as [Message, string][]
                        ).map(([key, value]) => (
                          <div key={key}>
                            <dt>{t(key)}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                      {admin && !event.archived && (
                        <button
                          className="danger"
                          disabled={pending}
                          onClick={() =>
                            mutate(
                              "events",
                              { ...event, archived: true },
                              event.id,
                            )
                          }
                        >
                          {t("Archive")}
                        </button>
                      )}
                      {canRegister &&
                        button("Register athlete", () => setRegistration(null))}
                    </section>
                    <section className="panel">
                      <h2>{t("Discipline")}</h2>
                      <div className="chips">
                        {eventDisciplines.map((d) => (
                          <span className="chip" key={d.id}>
                            {d.name}
                          </span>
                        ))}
                      </div>
                      {admin &&
                        button("Attach discipline", () =>
                          edit(
                            "event_disciplines",
                            "Attach discipline",
                            [
                              {
                                key: "discipline_id",
                                label: "Discipline",
                                options: refs(
                                  data.disciplines.filter(
                                    (d) =>
                                      d.is_active &&
                                      !eventDisciplines.some(
                                        (ed) => ed.id === d.id,
                                      ),
                                  ),
                                ),
                              },
                            ],
                            { event_id: event.id },
                          ),
                        )}
                    </section>
                  </div>
                  <div className="info-card">
                    <h3>{t("Registration rules")}</h3>
                    <p>{t("Bounds description")}</p>
                  </div>
                </>
              )}
              {tab === "categories" && (
                <>
                  {tools(
                    admin &&
                      button("New category", () =>
                        edit("categories", "New category", categoryFields, {
                          event_id: event.id,
                          min_age: 0,
                          max_age: 120,
                          min_weight: 0,
                          gender: "MALE",
                        }),
                      ),
                  )}
                  <p className="hint">{t("Bounds description")}</p>
                  {table(
                    [
                      "Name",
                      "Discipline",
                      "Gender",
                      "Min age",
                      "Max age",
                      "Min weight",
                      "Max weight",
                      "Experience",
                      "Manage",
                    ],
                    data.categories
                      .filter((c) => c.event_id === event.id && match(c))
                      .map((c) => [
                        c.name,
                        disciplineName(c.discipline_id),
                        t(c.gender),
                        c.min_age,
                        c.max_age,
                        `> ${c.min_weight}`,
                        `≤ ${c.max_weight}`,
                        experienceName(c.experience_level),
                        admin
                          ? editButton(() =>
                              edit(
                                "categories",
                                "Edit",
                                categoryFields,
                                c,
                                c.id,
                              ),
                            )
                          : "—",
                      ]),
                  )}
                </>
              )}
              {tab === "registrations" && (
                <>
                  {tools(
                    <>
                      <select
                        aria-label={t("Status")}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="">{t("All statuses")}</option>
                        {["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].map(
                          (s) => (
                            <option value={s} key={s}>
                              {t(s as Message)}
                            </option>
                          ),
                        )}
                      </select>
                      <select
                        aria-label={t("Club")}
                        value={clubFilter}
                        onChange={(e) => setClubFilter(e.target.value)}
                      >
                        <option value="">{t("All clubs")}</option>
                        {data.clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={t("Discipline")}
                        value={disciplineFilter}
                        onChange={(e) => setDisciplineFilter(e.target.value)}
                      >
                        <option value="">{t("All disciplines")}</option>
                        {eventDisciplines.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {(canRegister || admin) &&
                        button("Register athlete", () => setRegistration(null))}
                    </>,
                  )}
                  {table(
                    [
                      "Athlete",
                      "Club",
                      "Discipline",
                      "Declared weight",
                      "Category",
                      "Status",
                      "Manage",
                    ],
                    data.registrations
                      .filter(
                        (r) =>
                          r.event_id === event.id &&
                          (!filter || r.status === filter) &&
                          (!disciplineFilter ||
                            r.discipline_id === disciplineFilter),
                      )
                      .flatMap((r) => {
                        const a = data.athletes.find(
                          (a) => a.id === r.athlete_id,
                        );
                        if (
                          !a ||
                          !match({ ...r, ...a }) ||
                          (clubFilter && a.club_id !== clubFilter)
                        )
                          return [];
                        return [
                          [
                            `${a.first_name} ${a.last_name}`,
                            clubName(a.club_id),
                            disciplineName(r.discipline_id),
                            r.declared_weight,
                            data.categories.find((c) => c.id === r.category_id)
                              ?.name ?? t("Unassigned"),
                            badge(r.status),
                            admin ||
                            (canRegister &&
                              ["DRAFT", "SUBMITTED"].includes(r.status))
                              ? editButton(() => setRegistration(r))
                              : "—",
                          ],
                        ];
                      }),
                  )}
                </>
              )}
            </>
          )}
          {section === "clubs" && !id && (
            <>
              {tools()}
              {table(
                ["Name", "Country", "City", "Email", "Athletes", "Manage"],
                data.clubs.filter(match).map((c) => [
                  <Link
                    className="row-title"
                    key="name"
                    href={`/clubs/${c.id}`}
                  >
                    {c.name}
                  </Link>,
                  c.country,
                  c.city,
                  c.email,
                  data.athletes.filter((a) => a.club_id === c.id).length,
                  <Link className="quiet" key="view" href={`/clubs/${c.id}`}>
                    {t("View")} <ArrowUpRight size={15} />
                  </Link>,
                ]),
              )}
              {admin && (
                <div className="info-grid">
                  <ReferencePanel
                    title="Discipline"
                    items={data.disciplines}
                    onAdd={() =>
                      edit("disciplines", "Add discipline", [
                        { key: "name", label: "Name" },
                      ])
                    }
                  />
                  <ReferencePanel
                    title="Experience"
                    items={data.experience_levels}
                    onAdd={() =>
                      edit("experience_levels", "Add experience level", [
                        { key: "name", label: "Name" },
                      ])
                    }
                  />
                </div>
              )}
            </>
          )}
          {club && (
            <>
              <div className="detail-grid">
                <section className="panel">
                  <h2>{t("Overview")}</h2>
                  <p>
                    {club.country} · {club.city}
                  </p>
                  <p>{club.email}</p>
                  <p>{club.phone}</p>
                </section>
                <section className="panel">
                  <h2>{t("Coaches")}</h2>
                  {data.club_members
                    .filter((m) => m.club_id === club.id)
                    .map((m) => (
                      <p className="member" key={m.id}>
                        {data.profiles.find((p) => p.id === m.user_id)
                          ?.full_name || m.user_id}
                      </p>
                    ))}
                  {admin &&
                    button("Assign coach", () =>
                      edit(
                        "club_members",
                        "Assign coach",
                        [{ key: "user_id", label: "User ID" }],
                        { club_id: club.id },
                      ),
                    )}
                </section>
              </div>
              <div className="section-heading">
                <h2>{t("Athletes")}</h2>
                {button("New athlete", () => athleteEditor())}
              </div>
              {athleteTable(data.athletes.filter((a) => a.club_id === club.id))}
            </>
          )}
          {section === "athletes" && !id && (
            <>
              {tools(
                <select
                  aria-label={t("Club")}
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                >
                  <option value="">{t("All clubs")}</option>
                  {data.clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>,
              )}
              {athleteTable(
                data.athletes.filter(
                  (a) =>
                    match({ ...a, club: clubName(a.club_id) }) &&
                    (!clubFilter || a.club_id === clubFilter),
                ),
              )}
            </>
          )}
          {athlete && (
            <section className="panel">
              <dl>
                {(
                  [
                    ["Club", clubName(athlete.club_id)],
                    ["Date of birth", athlete.date_of_birth],
                    ["Gender", t(athlete.gender)],
                  ] as [Message, string][]
                ).map(([key, value]) => (
                  <div key={key}>
                    <dt>{t(key)}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {["matchmaking", "schedule"].includes(section) && (
            <div className="coming-soon">
              <div className="coming-icon">
                {section === "matchmaking" ? (
                  <Swords size={38} />
                ) : (
                  <CalendarDays size={38} />
                )}
              </div>
              <span className="eyebrow">II ETAPAS / PHASE II</span>
              <h2>{t("Coming soon")}</h2>
              <p>{t("Phase two")}</p>
            </div>
          )}
          <footer className="workspace-footer">
            <span>REAL FIGHT © {new Date().getFullYear()}</span>
            <span>TOURNAMENT MANAGER · I</span>
          </footer>
        </main>
      </div>
      {editor && (
        <Modal title={t(editor.title)} onClose={() => setEditor(null)}>
          <GenericForm
            fields={editor.fields}
            initial={editor.initial}
            pending={pending}
            onCancel={() => setEditor(null)}
            onSubmit={(values) => mutate(editor.entity, values, editor.id)}
          />
        </Modal>
      )}
      {registration !== undefined && event && (
        <Modal
          title={t(registration ? "Edit" : "Register athlete")}
          onClose={() => setRegistration(undefined)}
        >
          <RegistrationForm
            data={data}
            eventId={event.id}
            existing={registration}
            pending={pending}
            onSubmit={(values) =>
              mutate("registrations", values, registration?.id)
            }
            onCancel={() => setRegistration(undefined)}
          />
        </Modal>
      )}
    </div>
  );
  function athleteTable(athletes: Athlete[]) {
    return table(
      ["Athlete", "Club", "Date of birth", "Gender", "Manage"],
      athletes.map((a) => [
        <Link className="row-title" key="athlete" href={`/athletes/${a.id}`}>
          <span className="initials">
            {a.first_name[0]}
            {a.last_name[0]}
          </span>
          {a.first_name} {a.last_name}
        </Link>,
        clubName(a.club_id),
        a.date_of_birth,
        t(a.gender),
        editButton(() => athleteEditor(a)),
      ]),
    );
  }
}
function ReferencePanel({
  title,
  items,
  onAdd,
}: {
  title: Message;
  items: { id: string; name: string }[];
  onAdd: () => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{t(title)}</h2>
        <button
          aria-label={t(
            title === "Discipline" ? "Add discipline" : "Add experience level",
          )}
          onClick={onAdd}
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="chips">
        {items.map((item) => (
          <span className="chip" key={item.id}>
            {item.name}
          </span>
        ))}
      </div>
    </section>
  );
}
function localDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <header>
          <h2>{title}</h2>
          <button aria-label={t("Close")} onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function GenericForm({
  fields,
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  fields: Field[];
  initial: Row;
  pending: boolean;
  onSubmit: (values: Row) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [values, setValues] = useState<Row>(initial);
  const [invalid, setInvalid] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const next = { ...values };
        fields.forEach((f) => {
          if (f.type === "number") next[f.key] = Number(next[f.key] ?? 0);
          if (f.type === "datetime-local" && next[f.key])
            next[f.key] = new Date(String(next[f.key])).toISOString();
          if (next[f.key] === undefined)
            next[f.key] = f.options?.[0]?.value ?? "";
        });
        if (
          ("min_age" in next && Number(next.min_age) > Number(next.max_age)) ||
          ("min_weight" in next &&
            Number(next.min_weight) >= Number(next.max_weight)) ||
          ("start_date" in next &&
            String(next.start_date) > String(next.end_date))
        ) {
          setInvalid(true);
          return;
        }
        setInvalid(false);
        onSubmit(next);
      }}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.key}>
            {t(f.label)}
            {f.optional && <small> ({t("Optional")})</small>}
            {f.options ? (
              <select
                required={!f.optional}
                value={String(values[f.key] ?? "")}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              >
                <option value="" disabled>
                  —
                </option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                autoFocus={f === fields[0]}
                required={!f.optional}
                type={f.type ?? "text"}
                min={f.min}
                max={f.max}
                step={f.step}
                maxLength={f.key === "name" ? 160 : 200}
                value={String(values[f.key] ?? "")}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              />
            )}
          </label>
        ))}
      </div>
      {invalid && (
        <p role="alert" className="notice error">
          {t("Invalid data")}
        </p>
      )}
      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          {t("Cancel")}
        </button>
        <button className="primary" disabled={pending}>
          {t(pending ? "Loading" : "Save")}
        </button>
      </div>
    </form>
  );
}
function RegistrationForm({
  data,
  eventId,
  existing,
  pending,
  onSubmit,
  onCancel,
}: {
  data: Data;
  eventId: string;
  existing: Registration | null;
  pending: boolean;
  onSubmit: (values: Row) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const event = data.events.find((e) => e.id === eventId)!;
  const admin = data.profile.role === "ADMIN";
  const [v, setV] = useState<Row>(
    existing
      ? { ...existing }
      : {
          event_id: eventId,
          athlete_id: "",
          discipline_id: "",
          experience_level: "",
          declared_weight: "",
          total_fights: 0,
          total_wins: 0,
          coach_contact: "",
          notes: "",
          status: "SUBMITTED",
          category_id: null,
        },
  );
  const [invalid, setInvalid] = useState(false);
  const athlete = data.athletes.find((a) => a.id === v.athlete_id);
  const weight = Number(v.declared_weight);
  const eligible = athlete
    ? eligibleCategories(
        athlete,
        {
          event_id: eventId,
          discipline_id: String(v.discipline_id),
          experience_level: String(v.experience_level),
          declared_weight: weight,
        },
        event.start_date,
        data.categories as Category[],
      )
    : [];
  const selected =
    eligible.length === 1
      ? eligible[0].id
      : eligible.some((c) => c.id === v.category_id)
        ? String(v.category_id)
        : "";
  const update = (key: string, value: string) =>
    setV({
      ...v,
      [key]: value,
      ...([
        "athlete_id",
        "discipline_id",
        "declared_weight",
        "experience_level",
      ].includes(key)
        ? { category_id: null }
        : {}),
    });
  const disciplines = data.disciplines.filter((d) =>
    data.event_disciplines.some(
      (ed) => ed.event_id === eventId && ed.discipline_id === d.id,
    ),
  );
  const fields: Field[] = [
    {
      key: "athlete_id",
      label: "Athlete",
      options: data.athletes.map((a) => ({
        value: a.id,
        label: `${a.first_name} ${a.last_name} · ${data.clubs.find((c) => c.id === a.club_id)?.name ?? ""}`,
      })),
    },
    {
      key: "discipline_id",
      label: "Discipline",
      options: disciplines.map((d) => ({ value: d.id, label: d.name })),
    },
    {
      key: "declared_weight",
      label: "Declared weight",
      type: "number",
      min: 0.01,
      max: 500,
      step: "0.01",
    },
    {
      key: "experience_level",
      label: "Experience",
      options: data.experience_levels
        .filter((x) => x.is_active || x.id === v.experience_level)
        .map((x) => ({ value: x.id, label: x.name })),
    },
    {
      key: "total_fights",
      label: "Fights",
      type: "number",
      min: 0,
      max: 10000,
    },
    {
      key: "total_wins",
      label: "Wins",
      type: "number",
      min: 0,
      max: Number(v.total_fights),
    },
    { key: "coach_contact", label: "Coach contact", optional: true },
    { key: "notes", label: "Notes", optional: true },
  ];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (Number(v.total_wins) > Number(v.total_fights)) {
          setInvalid(true);
          return;
        }
        onSubmit({
          ...v,
          category_id: selected || null,
          declared_weight: weight,
          total_fights: Number(v.total_fights),
          total_wins: Number(v.total_wins),
        });
      }}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.key}>
            {t(f.label)}
            {f.options ? (
              <select
                required
                value={String(v[f.key] ?? "")}
                onChange={(e) => update(f.key, e.target.value)}
              >
                <option value="" disabled>
                  —
                </option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required={!f.optional}
                type={f.type ?? "text"}
                min={f.min}
                max={f.max}
                step={f.step ?? "1"}
                maxLength={f.key === "notes" ? 1000 : 200}
                value={String(v[f.key] ?? "")}
                onChange={(e) => update(f.key, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>
      {athlete && (
        <div className="category-suggestion">
          <div className="section-heading">
            <strong>
              {t("Age at event")}:{" "}
              {ageOn(athlete.date_of_birth, event.start_date)}
            </strong>
            <CheckCircle2 size={18} />
          </div>
          <p>
            {t(
              eligible.length === 1
                ? "Automatic category"
                : eligible.length > 1
                  ? "Multiple categories"
                  : "No matching category",
            )}
          </p>
          {eligible.length > 0 && (
            <label>
              {t("Category")}
              <select
                value={selected}
                onChange={(e) => update("category_id", e.target.value)}
              >
                <option value="">{t("Select category")}</option>
                {eligible.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      <label>
        {t("Status")}
        <select
          value={String(v.status)}
          onChange={(e) => update("status", e.target.value)}
        >
          {(admin
            ? ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]
            : ["DRAFT", "SUBMITTED"]
          ).map((s) => (
            <option key={s} disabled={s === "APPROVED" && !selected} value={s}>
              {t(s as Message)}
            </option>
          ))}
        </select>
      </label>
      {invalid && <p className="notice error">{t("Invalid data")}</p>}
      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          {t("Cancel")}
        </button>
        <button
          className="primary"
          disabled={pending || (v.status === "APPROVED" && !selected)}
        >
          {t(pending ? "Loading" : "Save")}
        </button>
      </div>
    </form>
  );
}
