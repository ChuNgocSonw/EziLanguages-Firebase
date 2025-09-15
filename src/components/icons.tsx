import React from 'react';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export const Logo = ({ className, width = 32, height = 32 }: LogoProps) => (
    <Image
        src="/logo.png"
        alt="Ezi Languages Logo"
        width={width}
        height={height}
        className={className}
    />
);
