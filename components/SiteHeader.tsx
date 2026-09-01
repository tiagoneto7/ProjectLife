import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import SiteHeaderClient from "@/components/SiteHeaderClient";

export default function SiteHeader() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const isAdmin = isValidAdminSession(token);

  return <SiteHeaderClient isAdmin={isAdmin} />;
}
