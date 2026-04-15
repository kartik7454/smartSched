'use client'

import { useEffect, useState } from 'react'

export default function StudentNav() {
  return (
    <nav className="student-nav bg-white shadow-md rounded-lg px-6 py-3 w-full max-w-3xl mx-auto mt-2 mb-2">
      <ul className="flex flex-row justify-between gap-6">
        <li>
          <a
            href="/dashboard/faculty"
            className="px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-800 font-medium transition-all"
          >
            Dashboard
          </a>
        </li>
        <li>
          <a
            href="/myTimetable/faculty"
            className="px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-800 font-medium transition-all"
          >
           Timetable
          </a>
        </li>
        <li>
          <a
            href="/student/profile"
            className="px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-800 font-medium transition-all"
          >
            Profile
          </a>
        </li>
        <li>
          <a
            href="/student/notifications"
            className="px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-800 font-medium transition-all"
          >
            Notifications
          </a>
        </li>
        <li>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="px-4 py-2 rounded-md text-red-700 hover:bg-red-100 hover:text-red-800 font-medium transition-all"
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  )
}
