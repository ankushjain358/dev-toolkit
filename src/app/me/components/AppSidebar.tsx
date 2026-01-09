"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  User,
  Settings,
  Bell,
  BookOpen,
  Bookmark,
  FileText,
  Layout,
  LogOut,
  Tags,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { APP_CONSTANTS } from "@/lib/app-constants";

const icons = {
  Home,
  User,
  Settings,
  BookOpen,
  Bookmark,
  FileText,
  Layout,
  LogOut,
  Tags,
  ChevronRight,
};

// Navigation data with actual links
const data = {
  navMain: [
    {
      title: "Overview",
      url: "/me",
      items: [
        {
          title: "Dashboard",
          url: "/me",
          icon: "Home",
        },
      ],
    },
    {
      title: "Dev Tools",
      url: "/me/blogs",
      items: [
        {
          title: "Blogs",
          url: "/me/blogs",
          icon: "BookOpen",
        },
        {
          title: "Bookmarks",
          url: "/me/bookmarks",
          icon: "Bookmark",
        },
        {
          title: "Notes",
          url: "/me/notes",
          icon: "FileText",
        },
        {
          title: "Boards",
          url: "/me/boards",
          icon: "Layout",
        },
      ],
    },
    {
      title: "Account",
      url: "/me/profile",
      items: [
        {
          title: "Profile",
          url: "/me/profile",
          icon: "User",
        },
        {
          title: "Settings",
          url: "/me/settings",
          icon: "Settings",
          subItems: [
            {
              title: "Tags",
              url: "/me/settings/tags",
              icon: "Tags",
            },
          ],
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/me">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Bell className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">{APP_CONSTANTS.APP_NAME}</span>
                  <span className="">{APP_CONSTANTS.VERSION}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex-1">
          {data.navMain.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = icons[item.icon as keyof typeof icons];
                    const isActive = pathname === item.url;

                    if (item.subItems) {
                      return (
                        <Collapsible
                          key={item.title}
                          asChild
                          defaultOpen={pathname.startsWith(item.url)}
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className="flex items-center">
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {item.title}
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subItems.map((subItem) => {
                                  const SubIcon =
                                    icons[subItem.icon as keyof typeof icons];
                                  const isSubActive = pathname === subItem.url;
                                  return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={isSubActive}
                                      >
                                        <Link
                                          href={subItem.url}
                                          className="flex items-center"
                                        >
                                          {SubIcon && (
                                            <SubIcon className="mr-2 h-4 w-4" />
                                          )}
                                          {subItem.title}
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url} className="flex items-center">
                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                            {item.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
        {/* Logout Footer */}
        <div className="border-t p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button
                  onClick={() => {
                    // Add your logout logic here
                    console.log("Logout clicked");
                  }}
                  className="flex items-center w-full text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
