"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function AppPage() {
  return (
    <AppLayout
      chat={<ChatContainer />}
      dashboard={<Dashboard />}
    />
  );
}
