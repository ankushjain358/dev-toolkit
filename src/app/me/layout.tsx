
"use client"

import { Authenticator } from '@aws-amplify/ui-react';
import { Sidebar } from './components/Sidebar';
import { MainNav } from './components/main-nav';
import { SidebarSheet } from './components/sidebar-sheet';
import { PageBreadcrumb } from './components/page-breadcrumb';

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Authenticator>
      <div className="flex min-h-screen">
        {/* Sidebar for desktop */}
        <div className="hidden border-r bg-background md:block w-[240px]">
          <Sidebar />
        </div>
        <div className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center gap-4">
              <SidebarSheet />
              <MainNav className="mx-6" />
              <div className="ml-auto flex items-center space-x-4">
                {/* Add your sign out button here if needed */}
              </div>
            </div>
          </header>
          {/* Breadcrumb */}
          <div className="container flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="space-y-1">
              <PageBreadcrumb />
            </div>
            {/* Main content */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Authenticator>
  );
}