import React from 'react';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export const Logo = ({ className, width = 32, height = 32 }: LogoProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        className={className}
        viewBox="0 0 100 100" // Bạn có thể cần điều chỉnh viewBox này cho phù hợp với SVG của bạn
    >
        {/* Dán nội dung SVG của bạn vào đây */}
    </svg>
);
