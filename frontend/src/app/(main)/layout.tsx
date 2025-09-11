import { AppSidebar } from '@/components/appSidebar';
import Wrapper from '@/components/common/wrapper';
import Header from '@/components/header';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Litmus AI',
  description: 'Litmus AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider defaultOpen={false} className="">
      <Wrapper className='flex-1'>
        <AppSidebar />
        <Header />
        {/* <SidebarTrigger className='rounded-full size-10 bg-muted'/> */}
        {children}
      </Wrapper>
    </SidebarProvider>
  );
}
