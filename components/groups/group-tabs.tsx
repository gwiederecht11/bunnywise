"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function GroupTabs({ groupId }: { groupId: string }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Activity", href: `/groups/${groupId}` },
    { label: "Balances", href: `/groups/${groupId}/balances` },
    { label: "Settings", href: `/groups/${groupId}/settings` },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-foreground/10">
      {tabs.map((tab) => {
        const isActive =
          tab.href === `/groups/${groupId}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition hover:text-foreground ${
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground/60"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
