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


export const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.85 1.62-3.87 0-7-3.13-7-7s3.13-7 7-7c1.93 0 3.38.79 4.3 1.7l2.16-2.16C18.2.71 15.66 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 11.72-4.7 11.72-12.02 0-.77-.07-1.52-.2-2.28H12.48z"
            fill="currentColor"
        />
    </svg>
);
