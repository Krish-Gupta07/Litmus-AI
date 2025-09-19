'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Calendar1Icon,
  CheckCircleIcon,
  CircleIcon,
  CopyIcon,
  EllipsisIcon,
  TrashIcon,
  TypeIcon,
  XCircleIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getApi } from '@/helpers/api';
import { apiEndPoints } from '@/helpers/apiEndpoints';
import { useEffect, useState } from 'react';
import type { AnalysisResponse, AnalysisData, AnalysisMetadata } from '@/types/analysis';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Loading, { LoadingSpinner } from '@/components/common/loading';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const jobId = Number(id);
  const [responseData, setResponseData] = useState<AnalysisResponse | null>(null);
  const [metadata, setMetadata] = useState<AnalysisMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(jobId)) {
      setError('Invalid job id');
      setIsLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      setIsLoading(true);

      const response = await getApi(`${apiEndPoints.analysis.status(jobId)}`);

      console.log('Response', response);

      if (response.status !== 200) {
        console.error('Failed to fetch analysis data', {
          response: response.data,
          status: response.status,
        });
        toast.error('Failed to fetch analysis data');
        setError('Failed to fetch analysis data');
        setIsLoading(false);
        return;
      }

      setResponseData(response.data.data);

      setIsLoading(false);
    };

    fetchAnalysis();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="mx-auto flex h-[90vh] flex-col items-center justify-center">
        <Loading variant="ring" />
      </div>
    );
  }

  if (error || !responseData) {
    return (
      <div className="mx-auto mt-10 mb-20 max-w-2xl">Error: {error || 'Analysis not found'}</div>
    );
  }

  if (responseData.analysis.status === 'pending') {
    return (
      <div className="mx-auto flex h-[90vh] flex-col items-center justify-center">
        <Loading variant="ring" />
        <p className="mt-4 text-center">Response analysis is in progress</p>
      </div>
    );
  }

  const createdAt = new Date(metadata?.timestamp || Date.now());
  const formattedDate = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mx-auto mt-10 mb-20 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TypeIcon />
          <h1 className="text-2xl font-medium">{responseData.analysis.result.title}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <EllipsisIcon size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-muted-foreground focus:text-muted-foreground hover:!bg-neutral-700/20">
              <button
                className="flex w-full items-center gap-1"
                onClick={() => navigator.clipboard.writeText(id)}
              >
                <CopyIcon size={16} className="text-muted-foreground" />
                Copy ID
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive hover:!bg-destructive/20">
              <button className="flex w-full items-center gap-1" onClick={() => console.log(id)}>
                <TrashIcon size={16} className="text-destructive" />
                Delete
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Calendar1Icon size={16} />
        <span className="text-muted-foreground text-sm">{formattedDate}</span>
        {responseData.analysis.status === 'completed' ? (
          <span className="w-fit rounded-md bg-green-500/10 px-2 py-1 text-xs text-green-500">
            Completed
          </span>
        ) : responseData.analysis.status === 'failed' ? (
          <span className="w-fit rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-500">
            Failed
          </span>
        ) : (
          <span className="w-fit rounded-md bg-yellow-500/10 px-2 py-1 text-xs text-yellow-500">
            {responseData.analysis.status === 'running' ? 'Processing' : 'Pending'}
          </span>
        )}
      </div>

      {responseData.analysis.result.credibilityScore && (
        <div className="bg-sidebar mt-10 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">Credibility Assessment</h2>
          <div className="">
            <div className="flex items-center gap-2">
              {responseData.analysis.result.credibilityScore > 75 ? (
                <CheckCircleIcon className="text-green-500" />
              ) : responseData.analysis.result.credibilityScore > 50 ? (
                <CircleIcon className="text-yellow-500" />
              ) : (
                <XCircleIcon className="text-red-500" />
              )}
              <p className="text-2xl font-medium">
                {responseData.analysis.result.credibilityScore}%
              </p>
            </div>
            <Progress value={responseData.analysis.result.credibilityScore} className="mt-2" />
          </div>
          <div className="mt-4 text-xs font-medium">
            {responseData.analysis.result.credibilityScore > 75 ? (
              <div>
                <p className="w-fit rounded-md bg-green-500/10 px-2 py-1 text-green-500">
                  Highly Credible
                </p>
                <p className="text-muted-foreground mt-4">
                  Highly credible. The response is very accurate and credible.
                </p>
              </div>
            ) : responseData.analysis.result.credibilityScore > 50 ? (
              <div>
                <p className="w-fit rounded-md bg-yellow-500/10 px-2 py-1 text-yellow-500">
                  Average Credible
                </p>
                <p className="text-muted-foreground mt-4">
                  May or may not be credible. We recommend further verification.
                </p>
              </div>
            ) : (
              <div>
                <p className="w-fit rounded-md bg-red-500/10 px-2 py-1 text-red-500">
                  Poorly Credible
                </p>
                <p className="text-muted-foreground mt-4">
                  Poorly credible. The response is not accurate and credible.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-sidebar mt-5 rounded-lg p-4">
        <h2 className="text-muted-foreground mb-8 text-sm font-medium">Reasoning Data</h2>
        <p>{responseData.analysis.result.description}</p>
      </div>

      <div className="bg-sidebar mt-5 rounded-lg p-4">
        <h2 className="text-muted-foreground mb-8 text-sm font-medium">Analyzed Content</h2>
        <div className="mt-2">
          <p className="flex items-center gap-2">
            <TypeIcon size={16} /> {responseData.analysis.scrapedText}
          </p>
        </div>
      </div>

      {responseData.analysis.result.searchTopics.entities.length > 0 && (
        <div className="bg-sidebar mt-5 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">Entities</h2>
          <div className="flex flex-wrap gap-2">
            {responseData.analysis.result.searchTopics.entities.map((entity, index) => (
              <span
                key={index}
                className="rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-500"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      )}

      {responseData.analysis.result.searchTopics.concepts.length > 0 && (
        <div className="bg-sidebar mt-5 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">Concepts</h2>
          <div className="flex flex-wrap gap-2">
            {responseData.analysis.result.searchTopics.concepts.map((concept, index) => (
              <span
                key={index}
                className="rounded-md bg-purple-500/10 px-2 py-1 text-xs text-purple-500"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {responseData.analysis.result.searchTopics.claims.length > 0 && (
        <div className="bg-sidebar mt-5 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">Claims</h2>
          <div className="flex flex-wrap gap-2">
            {responseData.analysis.result.searchTopics.claims.map((claim, index) => (
              <p key={index}>{claim}</p>
            ))}
          </div>
        </div>
      )}

      {responseData.analysis.result.ragQuestions && (
        <div className="bg-sidebar mt-5 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">RAG Questions</h2>
          <p>{responseData.analysis.result.ragQuestions}</p>
        </div>
      )}

      {responseData.analysis.scrapedText && (
        <div className="bg-sidebar mt-5 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">Input Text</h2>
          <p>{responseData.analysis.scrapedText}</p>
        </div>
      )}
    </div>
  );
}
