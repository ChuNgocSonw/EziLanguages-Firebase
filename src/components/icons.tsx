import React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        {...props}
    >
        <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f55" />
                <stop offset="25%" stopColor="#d629b3" />
                <stop offset="50%" stopColor="#2971d6" />
                <stop offset="75%" stopColor="#31c26e" />
                <stop offset="100%" stopColor="#f8d64e" />
            </linearGradient>
            <radialGradient id="bubble-gradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#00c2ff" />
                <stop offset="100%" stopColor="#00529b" />
            </radialGradient>
        </defs>

        {/* Outer Ring */}
        <circle cx="128" cy="128" r="100" fill="none" stroke="url(#ring-gradient)" strokeWidth="16" />
        <g stroke="#000" strokeWidth="2" strokeOpacity="0.2">
             <circle cx="128" cy="24" r="12" fill="#f8d64e" />
             <circle cx="42" cy="72" r="12" fill="#f55" />
             <circle cx="214" cy="72" r="12" fill="#31c26e" />
        </g>
        
        {/* Main Bubble */}
        <path d="M128 50 C 70 50, 50 90, 50 128 C 50 166, 70 206, 128 206 C 186 206, 206 166, 206 128 C 206 90, 186 50, 128 50 Z" fill="url(#bubble-gradient)" />
        
        {/* 'e' letter */}
        <path d="M162,134c-2,16-12,26-34,26c-22,0-38-12-38-36c0-24,16-36,38-36c20,0,32,10,34,24h-24c-1-6-6-10-10-10c-12,0-18,8-18,22s6,22,18,22c4,0,9-4,10-10H162z" fill="#fff" />

        {/* Globe */}
        <g fill="hsl(var(--secondary))" transform="translate(170, 70) scale(0.45)">
            <circle cx="50" cy="50" r="48" fill="#003366" stroke="#fff" strokeWidth="2"/>
            <path d="M50 2 a48 48 0 0 1 0 96 a48 48 0 0 1 0 -96" fill="none" stroke="#fff" strokeWidth="3" />
            <path d="M2 50 a48 48 0 0 1 96 0 a48 48 0 0 1 -96 0" fill="none" stroke="#fff" strokeWidth="3" />
            <path d="M15 25 a40 40 0 0 1 70 0" fill="none" stroke="#fff" strokeWidth="2" />
            <path d="M15 75 a40 40 0 0 0 70 0" fill="none" stroke="#fff" strokeWidth="2" />
        </g>

        {/* Language Icons */}
        <g transform="translate(60, 170)">
            <rect x="0" y="0" width="40" height="40" rx="8" fill="#d62929"/>
            <text x="20" y="28" fontSize="24" fill="white" textAnchor="middle" fontWeight="bold">文</text>
        </g>
        
        <g transform="translate(156, 170)">
            <path d="M0 8 C0 3.58, 3.58 0, 8 0 H32 C36.42 0, 40 3.58, 40 8 V40 H20 C 10 40, 5 30, 0 25 V8 Z" fill="#f8d64e"/>
            <path d="M40 40 H20 C 10 40, 5 50, 0 55 C 10 50, 15 45, 20 45 H40 V40 Z" fill="#f5872b"/>
            <text x="20" y="28" fontSize="24" fill="white" textAnchor="middle" fontWeight="bold">A</text>
        </g>
    </svg>
);
