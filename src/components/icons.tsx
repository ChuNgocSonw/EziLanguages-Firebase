import Image from 'next/image';

export function Logo({ width = 50, height = 50, ...props }) {
  return (
    <Image
      src="/logo.png"
      alt="Ezi Languages Logo"
      width={width}
      height={height}
      {...props}
    />
  );
}
