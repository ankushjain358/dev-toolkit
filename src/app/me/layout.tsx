
"use client"

import { Authenticator } from '@aws-amplify/ui-react';
import { Sidebar } from './components/Sidebar';
import { TopMenu } from './components/TopMenu';

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Authenticator>
      <div className="min-h-screen">
        <TopMenu />
        <div className="flex">
          <Sidebar className="border-r" />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </Authenticator>
  );
}