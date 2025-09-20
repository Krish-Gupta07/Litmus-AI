"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircleIcon,
  CircleIcon,
  CopyIcon,
  EllipsisIcon,
  TrashIcon,
  TypeIcon,
  XCircleIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
  ClockIcon,
  FileTextIcon,
  LinkIcon,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getApi } from "@/helpers/api"
import { apiEndPoints } from "@/helpers/apiEndpoints"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import Loading from "@/components/common/loading"
import { AnalysisLoading } from "./analysis-loading"
import { AnalysisApiResponse } from "@/types"

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const jobId = Number(id)
  const [responseData, setResponseData] = useState<AnalysisApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchAnalysis = async () => {
    try {
      const response = await getApi(`${apiEndPoints.analysis.status(jobId)}`)

      console.log("Response", response)

      if (response.status !== 200) {
        console.error("Failed to fetch analysis data", {
          response: response.data,
          status: response.status,
        })
        toast.error("Failed to fetch analysis data")
        setError("Failed to fetch analysis data")
        setIsLoading(false)
        return
      }

      setResponseData(response.data)
      setIsLoading(false)

      if (response.data.data.analysis.status === "pending" || response.data.data.analysis.status === "running") {
        startPolling()
      } else {
        stopPolling()
      }
    } catch (error) {
      console.error("Error fetching analysis:", error)
      setError("Failed to fetch analysis data")
      setIsLoading(false)
    }
  }

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    pollingIntervalRef.current = setInterval(() => {
      fetchAnalysis()
    }, 2000)
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  useEffect(() => {
    if (!Number.isFinite(jobId)) {
      setError("Invalid job id")
      setIsLoading(false)
      return
    }

    fetchAnalysis()

    return () => {
      stopPolling()
    }
  }, [jobId])

  if (isLoading) {
    return (
      <div className="mx-auto flex h-[90vh] flex-col items-center justify-center px-4">
        <Loading variant="ring" />
      </div>
    )
  }

  if (error || !responseData) {
    return (
      <div className="mx-auto mt-10 mb-20 max-w-4xl px-4 sm:px-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 sm:p-8 text-center">
          <XCircleIcon className="mx-auto mb-4 h-8 w-8 sm:h-12 sm:w-12 text-destructive" />
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Analysis Not Found</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Error: {error || "Analysis not found"}</p>
        </div>
      </div>
    )
  }

  if (responseData.data.analysis.status === "pending" || responseData.data.analysis.status === "running") {
    return <AnalysisLoading progress={responseData.data.metadata.progress || 0} />
  }

  const createdAt = new Date(responseData.data.metadata.timestamp)
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const analysis = responseData.data.analysis
  const result = analysis.result

  return (
    <div className="mx-auto mt-6 sm:mt-10 mb-12 sm:mb-20 max-w-4xl px-4 sm:px-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 sm:mb-8 gap-4 animate-in fade-in-0 slide-in-from-top-4 duration-700">
        <div className="flex gap-3 sm:gap-4 items-start flex-1 min-w-0">
          <div className="p-2 sm:p-3 bg-primary/10 rounded-lg sm:rounded-xl border border-primary/20 flex-shrink-0">
            <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-balance leading-tight mb-2 break-words">
              {result.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ClockIcon size={14} className="sm:w-4 sm:h-4" />
                <span className="break-words">{formattedDate}</span>
              </div>
              {analysis.status === "completed" ? (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full w-fit">
                  <CheckCircleIcon size={12} className="sm:w-3.5 sm:h-3.5 text-green-500" />
                  <span className="text-green-500 font-medium text-xs sm:text-sm">Completed</span>
                </div>
              ) : analysis.status === "failed" ? (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full w-fit">
                  <XCircleIcon size={12} className="sm:w-3.5 sm:h-3.5 text-red-500" />
                  <span className="text-red-500 font-medium text-xs sm:text-sm">Failed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full w-fit">
                  <CircleIcon size={12} className="sm:w-3.5 sm:h-3.5 text-yellow-500" />
                  <span className="text-yellow-500 font-medium text-xs sm:text-sm">
                    {analysis.status === "running" ? "Processing" : "Pending"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0">
              <EllipsisIcon size={18} className="sm:w-5 sm:h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-muted-foreground focus:text-muted-foreground hover:!bg-neutral-700/20">
              <button className="flex w-full items-center gap-2" onClick={() => navigator.clipboard.writeText(id)}>
                <CopyIcon size={16} className="text-muted-foreground" />
                Copy ID
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive hover:!bg-destructive/20">
              <button className="flex w-full items-center gap-2" onClick={() => console.log(id)}>
                <TrashIcon size={16} className="text-destructive" />
                Delete
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Sections - Responsive */}
      <div className="space-y-4 sm:space-y-6">
        {result.credibilityScore !== undefined && (
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold">Credibility Assessment</h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  {result.credibilityScore > 75 ? (
                    <div className="p-2 sm:p-3 bg-green-500/10 rounded-full">
                      <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                  ) : result.credibilityScore > 50 ? (
                    <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-full">
                      <CircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                    </div>
                  ) : (
                    <div className="p-2 sm:p-3 bg-red-500/10 rounded-full">
                      <XCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">{result.credibilityScore}%</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Credibility Score</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Progress value={result.credibilityScore} className="h-2 sm:h-3" />

                {result.credibilityScore > 75 ? (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-500/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-green-500">
                        Highly Credible
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Highly credible. The response is very accurate and credible.
                    </p>
                  </div>
                ) : result.credibilityScore > 50 ? (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-yellow-500/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-yellow-500">
                        Average Credible
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      May or may not be credible. We recommend further verification.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-red-500/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-red-500">
                        Poorly Credible
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Poorly credible. The response is not accurate and credible.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <FileTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold">Analysis Result</h2>
          </div>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-foreground leading-relaxed text-sm sm:text-base">{result.description}</p>
          </div>
        </div>

        {result.sources && result.sources.length > 0 && (
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-450">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold">Sources</h2>
              <span className="bg-muted px-2 py-1 rounded-full text-xs font-medium">{result.sources.length}</span>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {result.sources.map((source, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 hover:bg-muted/50 rounded-lg sm:rounded-xl border border-border/50 hover:border-border transition-all duration-200"
                >
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <ExternalLinkIcon size={14} className="sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs sm:text-sm hover:text-primary transition-colors truncate"
                  >
                    {source.length > (window.innerWidth < 640 ? 40 : 80) ? 
                      source.slice(0, window.innerWidth < 640 ? 40 : 80) + "..." : 
                      source
                    }
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.scrapedText && (
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-600">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold">Original Input</h2>
            </div>
            <div className="bg-muted/30 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-border/50">
              <p className="text-foreground leading-relaxed font-mono text-xs sm:text-sm break-words">
                {analysis.scrapedText}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}