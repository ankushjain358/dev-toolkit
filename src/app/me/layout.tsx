"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { AppSidebar } from "./components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </Authenticator>
  );
}
