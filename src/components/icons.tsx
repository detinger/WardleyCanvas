import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
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
      <path d="M3 6l9 4 9-4" />
      <path d="M3 12l9 4 9-4" />
      <path d="M3 18l9-4" />
      <path d="M15 14l6-2.6" />
      <circle cx="12" cy="10" r="1" fill="currentColor" />
      <circle cx="21" cy="7.4" r="1" fill="currentColor" />
      <circle cx="3" cy="6" r="1" fill="currentColor" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
      <circle cx="3" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
