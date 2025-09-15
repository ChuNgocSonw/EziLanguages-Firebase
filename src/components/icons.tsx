import Image from 'next/image';

export function Logo({ width = 32, height = 32, ...props }) {
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
