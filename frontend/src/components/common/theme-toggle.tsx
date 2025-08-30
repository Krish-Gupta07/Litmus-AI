'use client';

import * as React from 'react';
import { ComputerIcon, Moon, MoonIcon, Sun, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className='relative'>
        <button className="bg-muted text-primary h-full rounded-xl px-3 py-3 transition-colors duration-300">
          <Sun
            size={16}
            className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          />
          <Moon
            size={16}
            className="absolute bottom-[12px] scale-0 rotate-90 text-neutral-300 transition-all dark:scale-100 dark:rotate-0"
          />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="mt-2 w-40">
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer py-2 hover:!text-black group">
          <SunIcon className='group-hover:text-black'/>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer py-2 hover:!text-black group">
          <MoonIcon className='group-hover:text-black'/>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer py-2 hover:!text-black group">
          <ComputerIcon className='group-hover:text-black'/>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
