"use client";

import { Tabs, Tab } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";

export function GroupTabs({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { key: "activity", label: "Activity", href: `/groups/${groupId}` },
    { key: "balances", label: "Balances", href: `/groups/${groupId}/balances` },
    { key: "settings", label: "Settings", href: `/groups/${groupId}/settings` },
  ];

  const selectedKey = tabs.find((tab) =>
    tab.key === "activity"
      ? pathname === tab.href
      : pathname.startsWith(tab.href),
  )?.key ?? "activity";

  return (
    <div className="mb-6">
      <Tabs
        selectedKey={selectedKey}
        onSelectionChange={(key) => {
          const tab = tabs.find((t) => t.key === key);
          if (tab) router.push(tab.href);
        }}
        variant="underlined"
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>
    </div>
  );
}
