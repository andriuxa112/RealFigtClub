import { configured } from "@/lib/supabase/server";
import { Login } from "@/components/login";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <Login
      configured={configured()}
      profileMissing={params.error === "profile"}
    />
  );
}
