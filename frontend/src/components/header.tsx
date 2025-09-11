import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { ModeToggle } from './common/theme-toggle';
import { UserIcon } from 'lucide-react';
import Link from 'next/link';
import Logo from '../../public/icons/logo';
import { SidebarTrigger } from './ui/sidebar';

// interface Props {
//   onNewChat: () => void;
// }

export default function Header() {
  return (
    <header className="h-16 w-full gap-4 space-x-4 py-4">
      <div className="flex items-center justify-between">
        {/* <button
          onClick={onNewChat}
          className="bg-muted text-primary rounded-xl px-3 py-3 transition-all duration-300 hover:bg-muted/80 hover:px-4 flex items-center gap-1 overflow-hidden group"
          aria-label="Start a new chat"
        >
          <PlusIcon size={16} className='ml-1' />
          <span className="w-0 opacity-0 transition-all duration-300 group-hover:w-8 group-hover:opacity-100 whitespace-nowrap text-sm">
            New
          </span>
        </button> */}
        <div className="flex items-center gap-2 group">
          <Logo size={24} className='group-hover:hidden'/>
          <SidebarTrigger className='group-hover:block hidden rounded-full pl-[6px]'/>
          <Link href="/" className="font-medium">
            Litmus AI
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <SignedOut>
            <SignInButton>
              <button className="bg-accent text-secondary flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-[11px] text-sm font-medium transition-colors duration-300">
                <UserIcon size={16} />
                Sign In
              </button>
            </SignInButton>
            {/* <SignUpButton>
            <button className="bg-neutral-200 text-neutral-800 rounded-full font-semibold text-sm cursor-pointer py-2 px-4">
            Sign Up
            </button>
            </SignUpButton> */}
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
