import { ExternalLayout } from "@/components/layout/external-layout";
import { Card, CardContent } from "@/components/ui/card";
import { getSiteSettings } from "@/services/db.service";
import {
  Mail,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Instagram,
} from "lucide-react";
import Link from "next/link";

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const contactMethods = [
    {
      icon: Mail,
      label: "Email",
      value: settings.email,
      href: settings.email ? `mailto:${settings.email}` : null,
    },
    {
      icon: Globe,
      label: "Website",
      value: settings.website,
      href: settings.website,
    },
    {
      icon: Twitter,
      label: "Twitter",
      value: settings.twitterUrl,
      href: settings.twitterUrl,
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: settings.linkedinUrl,
      href: settings.linkedinUrl,
    },
    {
      icon: Github,
      label: "GitHub",
      value: settings.githubUrl,
      href: settings.githubUrl,
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: settings.instagramUrl,
      href: settings.instagramUrl,
    },
  ].filter((method) => method.value);

  return (
    <ExternalLayout>
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Get in Touch</h1>
          <div className="w-20 h-1 bg-primary mx-auto mb-6" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question or want to connect? Reach out through any of the
            channels below.
          </p>
        </div>

        {contactMethods.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const content = (
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-8 text-center">
                    <Icon className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">
                      {method.label}
                    </h3>
                    <p className="text-sm text-muted-foreground break-words">
                      {method.label === "Email"
                        ? method.value
                        : method.value?.replace(/^https?:\/\//, "")}
                    </p>
                  </CardContent>
                </Card>
              );

              return method.href ? (
                <Link
                  key={method.label}
                  href={method.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {content}
                </Link>
              ) : (
                <div key={method.label}>{content}</div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No contact information available yet.
            </p>
          </div>
        )}
      </div>
    </ExternalLayout>
  );
}
