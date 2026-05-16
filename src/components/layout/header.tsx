import Link from "next/link";
import { Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import outputs from "@/../amplify_outputs.json";
import { getSiteSettings, SiteSettingsData } from "@/services/db.service";

export const revalidate = 86400;

export async function Header() {
  const settings: SiteSettingsData = await getSiteSettings();
  const siteName = settings.siteName || "Default Blog";
  const logoUrl = settings.logoLightUrl
    ? `https://${outputs.custom.distributionDomainName}/${settings.logoLightUrl}`
    : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 flex h-16 items-center justify-between max-w-none">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          {logoUrl && (
            <img src={logoUrl} alt={siteName} className="h-8 w-8 rounded-lg" />
          )}
          <span className="font-bold text-xl">{siteName}</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            href="/blogs"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Search and Theme Toggle */}
        <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search articles..."
              className="pl-10 w-64"
              disabled
            />
          </div>
          <Button variant="ghost" size="icon">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
