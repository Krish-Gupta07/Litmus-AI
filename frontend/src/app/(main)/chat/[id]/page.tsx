'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import {
  ArrowUpRightIcon,
  Calendar1Icon,
  CheckCircleIcon,
  CircleIcon,
  CopyIcon,
  EllipsisIcon,
  LinkIcon,
  TrashIcon,
  TypeIcon,
  XCircleIcon,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockResponses } from '@/lib/mockResponse';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const mockResponse = mockResponses.find((c) => c.id === id);
  if (!mockResponse) {
    return <div>Chat not found</div>;
  }
  const createdAt = new Date(mockResponse.createdAt);
  const formattedDate = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',

    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div>
      <div className="mx-auto mt-10 mb-20 max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mockResponse.inputType === 'url' ? <LinkIcon /> : <TypeIcon />}
            <h1 className="text-2xl font-medium">{mockResponse.payload.title}</h1>
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
          {mockResponse.status === 'success' ? (
            <span className="w-fit rounded-md bg-green-500/10 px-2 py-1 text-xs text-green-500">
              Completed
            </span>
          ) : (
            <span className="w-fit rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-500">
              Failed
            </span>
          )}
        </div>

        <div className="bg-sidebar mt-10 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">Credibility Assessment</h2>
          <div className="">
            <div className="flex items-center gap-2">
              {mockResponse.accuracy > 75 ? (
                <CheckCircleIcon className="text-green-500" />
              ) : mockResponse.accuracy > 50 ? (
                <CircleIcon className="text-yellow-500" />
              ) : (
                <XCircleIcon className="text-red-500" />
              )}
              <p className="text-2xl font-medium">{mockResponse.accuracy}%</p>
            </div>
            <Progress value={mockResponse.accuracy} className="mt-2" />
          </div>
          <div className="mt-4 text-xs font-medium">
            {mockResponse.accuracy > 75 ? (
              <div>
                <p className="w-fit rounded-md bg-green-500/10 px-2 py-1 text-green-500">
                  Highly Credible
                </p>
                <p className="text-muted-foreground mt-4">
                  Highly credible. The response is very accurate and credible.
                </p>
              </div>
            ) : mockResponse.accuracy > 50 ? (
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

        <div className="bg-sidebar mt-5 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">Reasoning Data</h2>
          <p>{mockResponse.payload.body}</p>
        </div>

        <div className="bg-sidebar mt-5 rounded-lg p-4">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium">Analyzed Content</h2>
          <div className="mt-2">
            {mockResponse.inputType === 'url' ? (
              <Link
                href={mockResponse.input}
                target="_blank"
                className="text-accent flex items-center gap-2 underline-offset-4 hover:underline"
              >
                <LinkIcon size={16} /> {mockResponse.input}
                <ArrowUpRightIcon size={16} />
              </Link>
            ) : (
              <p className="flex items-center gap-2">
                <TypeIcon size={16} /> {mockResponse.input}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
