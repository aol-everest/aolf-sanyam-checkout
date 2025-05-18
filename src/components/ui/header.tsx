import Image from 'next/image';

export function Header() {
  return (
    <div className="flex flex-col items-center mb-8">
      <Image
        src="/images/ic-logo.svg"
        alt="Art of Living Logo"
        width={115}
        height={45}
        className="h-auto"
        priority
      />
      <hr className="w-full max-w-[500px] mt-8 border-gray-200" />
    </div>
  );
}
