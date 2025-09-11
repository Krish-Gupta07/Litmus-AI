'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { CommandIcon, SearchIcon, LogInIcon, PlusIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { Button } from './ui/button';
import Logo from '../../public/icons/logo';
import { useRouter } from 'next/navigation';
import { mockResponses } from '@/lib/mockResponse';
import SidebarChatCard from './sidebar-chat-card';

export function AppSidebar() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useUser();
  const { isMobile, setOpen, setOpenMobile } = useSidebar();

  const filteredAnalysis = mockResponses.filter((analysis) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      analysis.payload.title.toLowerCase().includes(query) ||
      analysis.payload.body.toLowerCase().includes(query) ||
      analysis.inputType.toLowerCase().includes(query) ||
      analysis.status.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center">
            <Logo size={24} />
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SignedIn>
          <SidebarGroup>
            <SidebarGroupContent>
              <Button
                className="w-full bg-transparent text-xs"
                variant="outline"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  } else {
                    setOpen(false);
                  }
                  router.push('/');
                }}
              >
                <PlusIcon size={16} />
                New Chat
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Analysis History</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="relative">
                <SidebarInput
                  ref={searchInputRef}
                  placeholder="Search analysis history"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <SearchIcon
                  size={16}
                  className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2"
                />
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                  <kbd className="bg-muted text-muted-foreground flex items-center rounded px-2 py-0.5 font-mono text-xs">
                    <CommandIcon size={10} className="mr-1" />K
                  </kbd>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="flex-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <div className="space-y-3">
                  {filteredAnalysis.length > 0 ? (
                    filteredAnalysis.map((analysis) => (
                      <SidebarMenuItem key={analysis.id}>
                        {/* main card component here*/}
                        <SidebarChatCard analysis={analysis} />
                      </SidebarMenuItem>
                    ))
                  ) : (
                    <SidebarMenuItem>
                      <div className="py-8 text-center">
                        <SearchIcon size={32} className="text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">
                          No results found for "{searchQuery}"
                        </p>
                      </div>
                    </SidebarMenuItem>
                  )}
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SignedIn>

        <SignedOut>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
                <div className="bg-muted rounded-full p-3">
                  <LogInIcon size={24} className="text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Login to store history</h3>
                  <p className="text-muted-foreground text-sm">
                    Sign in to save and access your analysis history
                  </p>
                </div>
                <SignInButton>
                  <Button className="flex items-center gap-2">
                    <LogInIcon size={16} />
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SignedOut>
      </SidebarContent>

      <SignedIn>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1">
                <UserButton />
                <div className="flex flex-col text-sm font-medium">
                  <span className="truncate">{user?.fullName || 'User'}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.emailAddresses[0].emailAddress || 'User'}
                  </span>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SignedIn>
    </Sidebar>
  );
}
