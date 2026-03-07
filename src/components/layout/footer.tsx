import { getSiteSettings } from "@/services/common.service";
import outputs from "@/../amplify_outputs.json";
import {
  Twitter,
  Linkedin,
  Github,
  Globe,
  Instagram,
  Mail,
} from "lucide-react";
import Link from "next/link";

export async function Footer() {
  const settings = await getSiteSettings();
  const siteName = settings.siteName;
  const tagline = settings.tagline;
  const logoUrl = settings.logoDarkUrl || settings.logoLightUrl;
  const distributionUrl = logoUrl
    ? `https://${outputs.custom.distributionDomainName}/${logoUrl}`
    : "";

  const socialLinks = [
    { url: settings.website, icon: Globe, label: "Website" },
    { url: settings.twitterUrl, icon: Twitter, label: "Twitter" },
    { url: settings.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
    { url: settings.githubUrl, icon: Github, label: "GitHub" },
    { url: settings.instagramUrl, icon: Instagram, label: "Instagram" },
  ].filter((link) => link.url);

  return (
    <footer className="border-t bg-muted/50">
      <div className="w-full py-8 px-4 max-w-none">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex items-center space-x-2">
            {distributionUrl && (
              <img
                src={distributionUrl}
                alt={siteName}
                className="h-6 w-6 rounded"
              />
            )}
            <span className="font-semibold text-lg">{siteName}</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">{tagline}</p>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={link.label}
                >
                  <link.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          )}
          {settings.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${settings.email}`}
                className="hover:text-foreground transition-colors"
              >
                {settings.email}
              </a>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
