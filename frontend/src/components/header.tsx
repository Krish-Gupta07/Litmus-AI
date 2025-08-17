import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
  } from "@clerk/nextjs";
import { ModeToggle } from "./common/theme-toggle";
  
  export default function Header() {
    return (
      <header className="fixed top-0 right-5 p-4 gap-4 h-16 space-x-4">
        <SignedOut>
          <SignInButton>
            <button className="text-sm cursor-pointer">Sign In</button>
          </SignInButton>
          <SignUpButton>
            <button className="bg-neutral-200 text-neutral-800 rounded-full font-semibold text-sm cursor-pointer py-2 px-4">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <ModeToggle />
      </header>
    );
  }
  