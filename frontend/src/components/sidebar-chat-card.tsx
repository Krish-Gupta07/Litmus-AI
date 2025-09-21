"use client"

import {
  CheckCircleIcon,
  CircleIcon,
  EllipsisIcon,
  LinkIcon,
  TrashIcon,
  TypeIcon,
  XCircleIcon,
  ClockIcon,
  Loader2Icon,
} from "lucide-react"
import Link from "next/link"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { SidebarMenuAction, useSidebar } from "./ui/sidebar"
import { cn } from "@/lib/utils"
import type { Job } from "@/types/analysis"

export default function SidebarChatCard({ analysis }: { analysis: Job }) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar()

  // Parse the result if it's a string
  let parsedResult = null
  try {
    parsedResult = analysis.result ? JSON.parse(analysis.result) : null
  } catch (error) {
    console.error("Failed to parse analysis result:", error)
    parsedResult = null
  }

  // Determine the status display
  const getStatusDisplay = () => {
    switch (analysis.status) {
      case "COMPLETED":
        return {
          text: "Completed",
          className: "border-green-500/20 bg-green-500/10 text-green-500",
          icon: <CheckCircleIcon size={16} />,
        }
      case "RUNNING":
        return {
          text: "Running",
          className: "border-blue-500/20 bg-blue-500/10 text-blue-500",
          icon: <Loader2Icon size={16} className="animate-spin" />,
        }
      case "PENDING":
        return {
          text: "Pending",
          className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
          icon: <ClockIcon size={16} />,
        }
      case "FAILED":
        return {
          text: "Failed",
          className: "border-red-500/20 bg-red-500/10 text-red-500",
          icon: <XCircleIcon size={16} />,
        }
      default:
        return {
          text: "Unknown",
          className: "border-gray-500/20 bg-gray-500/10 text-gray-500",
          icon: <CircleIcon size={16} />,
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="hover:bg-sidebar-accent space-y-2 rounded-lg border p-3 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TypeIcon size={16} className="shrink-0" />
          <Link
            href={`/chat/${analysis.queueJobId}`}
            className="truncate text-sm font-medium underline-offset-4 hover:underline"
            onClick={() => {
              if (isMobile) {
                setOpenMobile(false)
              } else {
                setOpen(false)
              }
            }}
          >
            {parsedResult?.title || analysis.input.substring(0, 50) + "..."}
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover>
              <EllipsisIcon size={16} />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive hover:!bg-destructive/20">
              <button className="flex w-full items-center gap-1" onClick={() => console.log(analysis.id)}>
                <TrashIcon size={16} className="text-destructive" />
                Delete
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus: hover:!bg-neutral-700/20">
              <Link href={`/chat/${analysis.id}`} target="_blank" className="flex w-full items-center gap-1">
                <LinkIcon size={16} />
                Open in new tab
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {statusDisplay.icon}
          <span className="text-muted-foreground">
            {parsedResult?.credibilityScore ? `${parsedResult.credibilityScore}% credible` : "Processing..."}
          </span>
        </div>
        <span className={cn("rounded-md border px-2 py-1 text-xs font-medium uppercase", statusDisplay.className)}>
          {statusDisplay.text}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground line-clamp-2">{parsedResult?.description || analysis.input}</p>
        <p className="text-muted-foreground text-xs">{new Date(analysis.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  )
}
