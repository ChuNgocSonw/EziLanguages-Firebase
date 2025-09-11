import React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w.org/2000/svg"
        viewBox="0 0 256 256"
        {...props}
    >
        <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'hsl(var(--secondary))', stopOpacity: 1}} />
            </radialGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: 'hsl(var(--accent))'}} />
                <stop offset="100%" style={{stopColor: 'hsl(var(--primary))'}} />
            </linearGradient>
        </defs>
        <g transform="translate(128, 128) scale(1.2)">
            <circle cx="0" cy="0" r="100" fill="none" stroke="url(#grad2)" strokeWidth="12" />
            <circle cx="0" cy="0" r="80" fill="url(#grad1)" />
            
            <path d="M -40 -50 L -40 50 L 0 50 L 0 -10 L 20 -10 L 20 50 L 60 50 L 60 -50 L 20 -50 L 20 -30 L 0 -30 L 0 -50 Z"
                  fill="hsl(var(--primary-foreground))"
                  transform="translate(-5, 0)"
            />
            
            <circle cx="-85" cy="-55" r="10" fill="hsl(var(--accent))" />
            <circle cx="-45" cy="-88" r="10" fill="hsl(var(--primary))" />
            <circle cx="10" cy="-95" r="10" fill="hsl(var(--secondary))" />
        </g>
    </svg>
);