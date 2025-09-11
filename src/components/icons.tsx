import React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M20 12v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
        <path d="M4 12V8a2 2 0 0 1 2-2h1.2" />
        <path d="m10 6 2 2 2-2" />
        <path d="M12 8V6" />
        <path d="M20 12h-2a2 2 0 0 0-2-2V8a2 2 0 0 1 2-2h2Z" />
    </svg>
);
