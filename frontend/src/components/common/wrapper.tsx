import { cn } from '@/lib/utils';

interface WrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function Wrapper({ children, className }: WrapperProps) {
  return <div className={cn(className, 'mx-auto px-6')}>{children}</div>;
}
