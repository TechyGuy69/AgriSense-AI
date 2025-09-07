"use client"

import * as React from "react"
import { ChevronLeft, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Sidebar container
const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <aside
      ref={ref}
      className={cn(
        "group flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 data-[collapsible=icon]:w-16",
        className
      )}
      {...props}
    />
  )
})
Sidebar.displayName = "Sidebar"

// Sidebar header
const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between px-4 py-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

// Sidebar content (fixed ✅)
const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn("flex flex-1 flex-col overflow-hidden", className)}
      {...props}
    >
      {/* Scrollable section for navigation */}
      <div className="flex-1 overflow-y-auto pr-2">{children}</div>

      {/* Sticky bottom nav stays visible */}
      <div className="sticky bottom-0 bg-sidebar p-2 border-t border-sidebar-border">
        <div className="flex justify-around gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Location
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Type
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Layers
          </Button>
        </div>
      </div>
    </div>
  )
})
SidebarContent.displayName = "SidebarContent"

// Sidebar footer (if you need one)
const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("border-t border-sidebar-border px-4 py-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

// Sidebar menu container
const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("space-y-1 p-2", className)} {...props} />
  )
})
SidebarMenu.displayName = "SidebarMenu"

// Sidebar menu item
interface SidebarMenuItemProps extends React.ComponentProps<"button"> {
  icon: LucideIcon
  label: string
  isActive?: boolean
  onClick?: () => void
}

const SidebarMenuItem = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuItemProps
>(({ icon: Icon, label, isActive, className, ...props }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground",
            className
          )}
          {...props}
        >
          <Icon className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

// Sidebar toggle
const SidebarToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "absolute -right-3 top-3 z-10 h-6 w-6 rounded-full border bg-background shadow",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  )
})
SidebarToggle.displayName = "SidebarToggle"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarToggle,
}
