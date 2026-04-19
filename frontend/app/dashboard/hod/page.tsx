'use client'

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/apiBase";

type Department = {
  id: number;
  name: string;
  facultyCount: number;
  studentCount: number;
  sections: number;
};

function HodDashboard() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch HOD department info (replace with real API)
    async function fetchDept() {
      setLoading(true);
      try {
        // Replace URL with your backend department info endpoint
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/department/info`, {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {}
        });
        if (res.ok) {
          const data = await res.json();
          setDepartment({
            id: data.id,
            name: data.name,
            facultyCount: data.facultyCount,
            studentCount: data.studentCount,
            sections: data.sections,
          });
        }
      } catch (err) {
        // Optionally show error
      }
      setLoading(false);
    }
    fetchDept();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-10">
      {/* Quick Links */}
      <div className="bg-gradient-to-tr from-blue-50 via-white to-blue-100 shadow-lg rounded-2xl p-8 border border-stone-200 mb-6">
        <h3 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Quick Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          <a
            href="/generateTimetable"
            className="flex items-center gap-3 px-5 py-4 bg-blue-100 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-200/60 transition-all font-medium text-blue-900"
          >
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            Manage Timetable
          </a>
          <a
            href="/configData"
            className="flex items-center gap-3 px-5 py-4 bg-green-100 rounded-xl shadow-md hover:shadow-lg hover:bg-green-200/60 transition-all font-medium text-green-900"
          >
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.21.65.21 1v.09A1.65 1.65 0 0 0 21 12h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Config
          </a>
          
          <a
            href="/timetable/teacher"
            className="flex items-center gap-3 px-5 py-4 bg-indigo-100 rounded-xl shadow-md hover:shadow-lg hover:bg-indigo-200/60 transition-all font-medium text-indigo-900"
          >
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="7" r="4"></circle>
              <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"></path>
            </svg>
            Faculty Timetables
          </a>
          <a
            href="/timetable"
            className="flex items-center gap-3 px-5 py-4 bg-pink-100 rounded-xl shadow-md hover:shadow-lg hover:bg-pink-200/60 transition-all font-medium text-pink-900"
          >
            <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="13" rx="2"></rect>
              <path d="M16 3v4M8 3v4M3 10h18"/>
            </svg>
            Section Timetables
          </a>
        </div>
      </div>

      {/* Quick insights */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-stone-200">
        <h2 className="text-xl font-bold mb-4 text-stone-800 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-blue-600 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16l4-4 4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Quick insights
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-stone-200 bg-stone-50 h-24 animate-pulse shadow"
              />
            ))}
          </div>
        ) : department ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-blue-50 border border-blue-100 text-center py-5 px-3 shadow-md">
                <div className="text-2xl font-semibold text-blue-700">
                  {department.facultyCount}
                </div>
                <div className="text-sm text-blue-900/80 mt-1">
                  Faculty
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-center py-5 px-3 shadow-md">
                <div className="text-2xl font-semibold text-emerald-700">
                  {department.studentCount}
                </div>
                <div className="text-sm text-emerald-900/80 mt-1">
                  Students
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 text-center py-5 px-3 shadow-md">
                <div className="text-2xl font-semibold text-amber-700">
                  {department.sections}
                </div>
                <div className="text-sm text-amber-900/80 mt-1">
                  Sections
                </div>
              </div>
              <div className="rounded-xl bg-violet-50 border border-violet-100 text-center py-5 px-3 shadow-md">
                <div className="text-2xl font-semibold text-violet-700">
                  {department.sections > 0
                    ? (department.studentCount / department.sections).toFixed(1)
                    : "—"}
                </div>
                <div className="text-sm text-violet-900/80 mt-1">
                  Avg. students / section
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-stone-600 leading-relaxed">
              {department.sections > 0 && department.facultyCount > 0 ? (
                <>
                  About{" "}
                  <span className="font-medium text-stone-800">
                    {(department.studentCount / department.facultyCount).toFixed(1)}
                  </span>{" "}
                  students per faculty member, across{" "}
                  <span className="font-medium text-stone-800">
                    {department.sections}
                  </span>{" "}
                  {department.sections === 1 ? "section" : "sections"}.
                </>
              ) : (
                <>Add sections and faculty in configuration to see staffing ratios.</>
              )}
            </p>
          </>
        ) : (
          <p className="text-stone-500 text-sm">
            Could not load department data. Insights will appear once the overview is available.
          </p>
        )}
      </div>

      {/* Department Overview */}
   
    </div>
  );
}

export default HodDashboard;