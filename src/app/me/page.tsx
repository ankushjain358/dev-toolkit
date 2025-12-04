"use client";

import Link from "next/link";
import { BookOpen, Bookmark, FileText, Layout, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const devTools = [
    {
      title: "Blogs",
      description: "Write and manage your blog posts.",
      icon: BookOpen,
      href: "/me/blogs",
      count: 0,
    },
    {
      title: "Bookmarks",
      description: "Save and organize your favorite links.",
      icon: Bookmark,
      href: "/me/bookmarks",
      count: 0,
    },
    {
      title: "Notes",
      description: "Create and manage your personal notes.",
      icon: FileText,
      href: "/me/notes",
      count: 0,
    },
    {
      title: "Boards",
      description: "Organize your work with Kanban boards.",
      icon: Layout,
      href: "/me/boards",
      count: 0,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">
          Here is an overview of your dev tools
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {devTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.title} className="relative group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {tool.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">{tool.count}</span> items
                </p>
                <Link
                  href={tool.href}
                  className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <span className="sr-only">View {tool.title}</span>
                </Link>
                <Button
                  variant="ghost"
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
