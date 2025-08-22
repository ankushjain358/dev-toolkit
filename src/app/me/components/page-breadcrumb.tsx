"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

export function PageBreadcrumb() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="/me">Me</BreadcrumbLink>
      </BreadcrumbItem>
      {paths.slice(1).map((path, index) => (
        <BreadcrumbItem key={path}>
          <BreadcrumbLink 
            href={`/me/${paths.slice(1, index + 2).join('/')}`}
          >
            {path.charAt(0).toUpperCase() + path.slice(1)}
          </BreadcrumbLink>
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  )
}
