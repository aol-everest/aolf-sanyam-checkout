import Image from "next/image";

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
      <Image
        src="/images/ic-logo.svg"
        alt="Art of Living Logo"
        width={115}
        height={45}
        className="h-auto"
        priority
        />
      </div>
    </header>
  );
}
