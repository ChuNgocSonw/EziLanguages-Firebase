import React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        {...props}
    >
        <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{stopColor: '#00BFFF', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#003366', stopOpacity: 1}} />
            </radialGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#FF4500'}} />
                <stop offset="25%" style={{stopColor: '#FFD700'}} />
                <stop offset="50%" style={{stopColor: '#ADFF2F'}} />
                <stop offset="75%" style={{stopColor: '#00BFFF'}} />
                <stop offset="100%" style={{stopColor: '#8A2BE2'}} />
            </linearGradient>
        </defs>
        <g transform="translate(128, 128) scale(1.2)">
            <circle cx="0" cy="0" r="100" fill="none" stroke="url(#grad2)" strokeWidth="12" />
            <circle cx="0" cy="0" r="80" fill="url(#grad1)" />
            <text
                x="-5"
                y="20"
                fontFamily="Arial, sans-serif"
                fontSize="90"
                fill="white"
                textAnchor="middle"
                style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}
            >
                e
            </text>

            {/* Globe icon */}
            <g transform="translate(45, -45) scale(0.4)">
                <circle cx="0" cy="0" r="40" fill="#00529B" stroke="white" strokeWidth="3"/>
                <line x1="-40" y1="0" x2="40" y2="0" stroke="white" strokeWidth="3" />
                <line x1="0" y1="-40" x2="0" y2="40" stroke="white" strokeWidth="3" />
                <ellipse cx="0" cy="0" rx="20" ry="38" fill="none" stroke="white" strokeWidth="3"/>
                <ellipse cx="0" cy="0" rx="38" ry="20" fill="none" stroke="white" strokeWidth="3"/>
            </g>

            {/* Red '文' icon */}
            <g transform="translate(-65, 55) scale(0.3)">
                <rect x="-50" y="-50" width="100" height="100" rx="10" fill="#DC143C"/>
                <text x="0" y="20" fontFamily="Arial, sans-serif" fontSize="80" fill="white" textAnchor="middle">文</text>
            </g>

            {/* Yellow 'A' icon */}
            <g transform="translate(65, 65) scale(0.3)">
                 <rect x="-50" y="-50" width="100" height="100" rx="10" fill="#FFD700"/>
                <text x="0" y="20" fontFamily="Arial, sans-serif" fontSize="80" fill="black" textAnchor="middle">A</text>
            </g>
            
            <circle cx="-85" cy="-55" r="10" fill="#FF4500" />
            <circle cx="-45" cy="-88" r="10" fill="#FFD700" />
            <circle cx="10" cy="-95" r="10" fill="#ADFF2F" />
        </g>
    </svg>
);
