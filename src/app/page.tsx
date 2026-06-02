import { EarthVideoHero } from "@/components/EarthVideoHero";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return <EarthVideoHero currentUser={user} />;
}
