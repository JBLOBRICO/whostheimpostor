import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeClient } from "@/components/home/home-client";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return <HomeClient />;
}
