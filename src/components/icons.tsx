import Image from 'next/image';

export function Logo({ width = 40, height = 40, ...props }) {
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
