import { ExternalLayout } from "@/components/layout/external-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <ExternalLayout>
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About Dev Toolkit</h1>
          <p className="text-xl text-muted-foreground">
            Empowering developers with the tools they need to succeed
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dev Toolkit was created to solve the common problem of scattered
                tools and workflows that developers face daily. We believe that
                productivity comes from having all your essential tools in one
                place, designed specifically for the developer mindset.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Content Creation</h3>
                  <p className="text-muted-foreground text-sm">
                    Write and publish technical blogs with our rich text editor,
                    complete with syntax highlighting and image support.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Organization Tools</h3>
                  <p className="text-muted-foreground text-sm">
                    Manage your bookmarks, notes, and tasks with intuitive
                    interfaces designed for developers.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Project Management</h3>
                  <p className="text-muted-foreground text-sm">
                    Track your projects and tasks with Kanban boards that
                    integrate seamlessly with your workflow.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Developer Profile</h3>
                  <p className="text-muted-foreground text-sm">
                    Build your online presence with a professional developer
                    profile and portfolio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">
                Built with Modern Technology
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Dev Toolkit is built using cutting-edge technologies including
                Next.js 15, AWS Amplify Gen 2, and a modern tech stack that
                ensures fast performance, scalability, and reliability. We
                practice what we preach by using the latest development tools
                and best practices.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ExternalLayout>
  );
}
