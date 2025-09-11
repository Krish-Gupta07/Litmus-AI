import {
  CheckCircleIcon,
  CircleIcon,
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
} from './ui/dropdown-menu';
import { SidebarMenuAction, useSidebar } from './ui/sidebar';
import { cn } from '@/lib/utils';

export default function SidebarChatCard({ analysis }: { analysis: any }) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  return (
    <div className="hover:bg-sidebar-accent space-y-2 rounded-lg border p-3 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {analysis.inputType === 'url' ? (
            <LinkIcon size={16} className="shrink-0" />
          ) : (
            <TypeIcon size={16} className="shrink-0" />
          )}
          <Link
            href={`/chat/${analysis.id}`}
            className="truncate text-sm font-medium underline-offset-4 hover:underline"
            onClick={() => {
              if (isMobile) {
                setOpenMobile(false);
              } else {
                setOpen(false);
              }
            }}
          >
            {analysis.payload.title}
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
              <button
                className="flex w-full items-center gap-1"
                onClick={() => console.log(analysis.id)}
              >
                <TrashIcon size={16} className="text-destructive" />
                Delete
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus: hover:!bg-neutral-700/20">
              <Link
                href={`/chat/${analysis.id}`}
                target="_blank"
                className="flex w-full items-center gap-1"
              >
                <LinkIcon size={16} />
                Open in new tab
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex items-center gap-2 text-sm',
            analysis.accuracy > 75
              ? 'text-green-600'
              : analysis.accuracy > 50
                ? 'text-orange-600'
                : 'text-red-600',
          )}
        >
          {analysis.accuracy > 75 ? (
            <CheckCircleIcon size={16} />
          ) : analysis.accuracy > 50 ? (
            <CircleIcon size={16} />
          ) : (
            <XCircleIcon size={16} />
          )}
          {analysis.accuracy}%
        </div>
        <span
          className={cn(
            'rounded-md border px-2 py-1 text-xs font-medium uppercase',
            analysis.status === 'success'
              ? 'border-green-500/20 bg-green-500/10 text-green-500'
              : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500',
          )}
        >
          {analysis.status === 'success' ? 'Completed' : 'Failed'}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground line-clamp-2">{analysis.payload.body}</p>
        <p className="text-muted-foreground text-xs">{analysis.createdAt}</p>
      </div>
    </div>
  );
}
