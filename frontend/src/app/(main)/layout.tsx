import Wrapper from "@/components/common/wrapper";
import Header from "@/components/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Litmus AI",
  description: "Litmus AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Wrapper>
      <Header />
      {children}
    </Wrapper>
  );
}
