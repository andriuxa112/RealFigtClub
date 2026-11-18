import { notFound } from "next/navigation";
import { loadData } from "@/lib/data";
import { Workspace } from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const valid =
    /^(dashboard|matchmaking|schedule|clubs|athletes|tournaments)$/.test(
      path[0],
    ) &&
    (path.length === 1 ||
      (["clubs", "athletes", "tournaments"].includes(path[0]) &&
        path.length === 2 &&
        (path[1] !== "new" || path[0] !== "clubs")) ||
      (path[0] === "tournaments" &&
        path[1] !== "new" &&
        path.length === 3 &&
        ["registrations", "categories"].includes(path[2])));
  if (!valid) notFound();
  const data = await loadData();
  if (path[1] && path[1] !== "new") {
    const records =
      path[0] === "clubs"
        ? data.clubs
        : path[0] === "athletes"
          ? data.athletes
          : data.events;
    if (!records.some((r) => r.id === path[1])) notFound();
  }
  return <Workspace data={data} path={path} />;
}
