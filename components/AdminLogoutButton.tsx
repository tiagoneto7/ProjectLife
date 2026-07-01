"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className="text-sm text-gray-500 underline">
      Sair
    </button>
  );
}
