import { Header } from "./header";
import { Footer } from "./footer";

interface ExternalLayoutProps {
  children: React.ReactNode;
}

export function ExternalLayout({ children }: ExternalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
