import React from 'react';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export const Logo = ({ className, width = 32, height = 32 }: LogoProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={width}
        height={height}
        className={className}
    >
        <defs>
            <radialGradient id="grad-blue" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00AEEF" />
                <stop offset="100%" stopColor="#004D8C" />
            </radialGradient>
            <linearGradient id="grad-ring-red" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D92E3D" />
                <stop offset="100%" stopColor="#F15A24" />
            </linearGradient>
            <linearGradient id="grad-ring-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F15A24" />
                <stop offset="100%" stopColor="#FBB03B" />
            </linearGradient>
            <linearGradient id="grad-ring-green" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8DC63F" />
                <stop offset="100%" stopColor="#39B54A" />
            </linearGradient>
             <linearGradient id="grad-ring-blue-arc" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00AEEF" />
                <stop offset="100%" stopColor="#0072BC" />
            </linearGradient>
        </defs>

        {/* Outer Ring */}
        <path d="M 95,50 A 45,45 0 0,1 50,95" stroke="url(#grad-ring-red)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 50,95 A 45,45 0 0,1 5,50" stroke="#A7499B" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 5,50 A 45,45 0 0,1 50,5" stroke="url(#grad-ring-blue-arc)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 50,5 A 45,45 0 0,1 95,50" stroke="url(#grad-ring-green)" strokeWidth="6" fill="none" strokeLinecap="round" />

        {/* Inner Speech Bubble */}
        <path d="M 75 50 C 75 69.33 59.33 85 40 85 C 35 85 30.25 84.1 26 82.5 L 20 88 L 25 78 C 21.5 73.5 19 67.5 19 60.5 C 19 41.17 40 26 59 26 C 68 26 75 35 75 50 Z" fill="url(#grad-blue)" />
        
        {/* Letter 'e' */}
        <text x="44" y="63" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle">e</text>

        {/* Globe Icon */}
        <circle cx="78" cy="22" r="12" fill="#004D8C" />
        <path d="M 78 10 V 34" stroke="white" strokeWidth="1.5" fill="none" />
        <path d="M 66 22 H 90" stroke="white" strokeWidth="1.5" fill="none" />
        <ellipse cx="78" cy="22" rx="6" ry="11.5" stroke="white" strokeWidth="1.5" fill="none" />
        <ellipse cx="78" cy="22" rx="11.5" ry="5" stroke="white" strokeWidth="1.5" fill="none" />

        {/* Language Icons */}
        <rect x="23" y="68" width="14" height="14" rx="2" fill="#D92E3D" />
        <text x="30" y="79" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">文</text>

        <path d="M 65 80 L 70 80 C 75 80 80 85 80 90 L 80 90 L 75 90 C 70 90 65 85 65 80 Z" fill="#F15A24" />
        <rect x="70" y="68" width="14" height="14" rx="2" fill="#FBB03B" />
        <text x="77" y="79" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">A</text>

        {/* Ring dots */}
        <circle cx="83" cy="9" r="5" fill="#FBB03B" />
        <circle cx="17" cy="25" r="5" fill="#D92E3D" />

    </svg>
);
