import { Header } from "@/components/ui/header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div>
      <div>
        <Header />
        {children}
      </div>
    </div>
  );
}
