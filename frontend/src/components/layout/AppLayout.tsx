"use client";

import { ReactNode } from "react";

interface AppLayoutProps {
  chat: ReactNode;
  dashboard: ReactNode;
}

export function AppLayout({ chat, dashboard }: AppLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Chat panel - left */}
      <div className="w-[40%] min-w-[360px] border-r border-zinc-200 flex flex-col bg-white">
        {chat}
      </div>

      {/* Dashboard panel - right */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 p-6">
        {dashboard}
      </div>
    </div>
  );
}
