'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

// Consistent with HodNav, with icons, improved layout, better colors
const navLinks = [
  {
    name: "Dashboard",
    href: "/dashboard/student",
    icon: (
      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7" />
      </svg>
    ),
  },
  {
    name: "Timetable",
    href: "/myTimetable",
    icon: (
      <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    ),
  },
  {
    name: "Profile",
    href: "/student/profile",
    icon: (
      <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-2a4 4 0 014-4h0a4 4 0 014 4v2" />
      </svg>
    ),
  },
  
];

export default function StudentNav() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <nav className="sticky top-2 z-30 shadow-xl bg-gradient-to-r from-white via-blue-50 to-blue-100 rounded-2xl px-8 py-4 w-full max-w-3xl mx-auto mt-4 transition-shadow mb-4 border border-blue-100">
      <ul className={`mt-4 sm:mt-0 flex-col sm:flex-row flex ${isOpen ? 'flex' : 'hidden sm:flex'} justify-evenly sm:justify-between items-start sm:items-center gap-2 sm:gap-6 transition-all`}>
        {navLinks.map((link) => (
          <li key={link.name}>
            <a
              href={link.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-900 bg-transparent hover:bg-blue-100 hover:text-blue-800 font-semibold tracking-wide shadow-sm transition-all duration-150"
            >
              {link.icon}
              {link.name}
            </a>
          </li>
        ))}
        <li>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-400 font-semibold tracking-wide transition-all duration-150 shadow-md"
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1118 0" />
            </svg>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}
