import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="grid place-items-center min-h-screen">
      <SignIn />
    </div>
  );
}
