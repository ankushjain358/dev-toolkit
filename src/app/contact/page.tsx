import { ExternalLayout } from "@/components/layout/external-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageSquare, Github } from "lucide-react";

export default function ContactPage() {
  return (
    <ExternalLayout>
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-muted-foreground">
            We&apos;d love to hear from you. Send us a message and we&apos;ll
            respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-muted-foreground text-sm">
                hello@devtoolkit.com
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Support</h3>
              <p className="text-muted-foreground text-sm">
                support@devtoolkit.com
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Github className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">GitHub</h3>
              <p className="text-muted-foreground text-sm">
                github.com/devtoolkit
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Contact Form
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Contact form functionality will be available soon. For now, please
              reach out via email.
            </p>
          </CardContent>
        </Card>
      </div>
    </ExternalLayout>
  );
}
