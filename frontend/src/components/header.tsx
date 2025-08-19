import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { ModeToggle } from './common/theme-toggle';
import { PlusIcon, UserIcon } from 'lucide-react';

interface Props {
  onNewChat: () => void;
}

export default function Header({ onNewChat }: Props) {
  return (
    <header className="fixed top-0 h-16 w-full gap-4 space-x-4 p-4">
      <div className="flex items-center justify-between">
      <button
          onClick={onNewChat}
          className="bg-muted text-primary rounded-xl px-3 py-3 transition-all duration-300 hover:bg-muted/80 hover:px-4 flex items-center gap-1 overflow-hidden group"
          aria-label="Start a new chat"
        >
          <PlusIcon size={16} className='ml-1' />
          <span className="w-0 opacity-0 transition-all duration-300 group-hover:w-8 group-hover:opacity-100 whitespace-nowrap text-sm">
            New
          </span>
        </button>
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton>
              <button className="bg-muted text-primary flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-[11px] text-sm font-medium transition-colors duration-300">
                <UserIcon size={16} />
                Log In
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
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
