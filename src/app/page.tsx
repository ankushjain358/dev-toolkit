import Link from "next/link";
import { ArrowRight, Code, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLayout } from "@/components/layout/external-layout";

export default function HomePage() {
  return (
    <ExternalLayout>
      {/* Hero Banner */}
      <section className="py-20 px-4 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Build Better with <span className="text-primary">Dev Toolkit</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A comprehensive productivity platform for developers. Manage your
            blogs, bookmarks, notes, and projects all in one place.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/blogs">
              Explore Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to stay productive
            </h2>
            <p className="text-muted-foreground text-lg">
              Streamline your development workflow with our integrated tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Code className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Blog & Share</h3>
                <p className="text-muted-foreground">
                  Write and publish technical articles with our rich text editor
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Stay Organized</h3>
                <p className="text-muted-foreground">
                  Manage bookmarks, notes, and tasks with Kanban boards
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Connect & Grow</h3>
                <p className="text-muted-foreground">
                  Build your developer profile and connect with the community
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </ExternalLayout>
  );
}
