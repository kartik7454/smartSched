"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef } from "react";
import {
  type Section,
  type Department,
  type Course,
  type TimetableEntry,
  DAY_ORDER,
} from "@/types/timetable";
import {
  getDepartments,
  getCourses,
  getSections,
  getTimetableBySection,
} from "@/lib/api";
import Link from "next/link";

function sectionLabel(s: Section) {
  return `${s.course?.name ?? "Course"} · Sem ${s.semester} ${s.name}${s.session?.name ? ` (${s.session.name})` : ""}`;
}

function formatTime(s: string) {
  if (!s) return "";
  const [h, m] = s.split(":").map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

function buildGrid(entries: TimetableEntry[]) {
  const byDay = new Map<number, Map<number, TimetableEntry[]>>();
  const slotSet = new Set<number>();

  for (const e of entries) {
    if (!byDay.has(e.dayId)) byDay.set(e.dayId, new Map());
    const bySlot = byDay.get(e.dayId)!;
    if (!bySlot.has(e.timeSlotId)) bySlot.set(e.timeSlotId, []);
    bySlot.get(e.timeSlotId)!.push(e);
    slotSet.add(e.timeSlotId);
  }

  const slotIds = Array.from(slotSet).sort(
    (a, b) =>
      (entries.find((e) => e.timeSlotId === a)?.timeSlot.slotNumber ?? 0) -
      (entries.find((e) => e.timeSlotId === b)?.timeSlot.slotNumber ?? 0)
  );

  const dayIdToOrder = new Map<number, number>();
  const dayNames = entries
    .map((e) => ({ id: e.day.id, name: e.day.name }))
    .filter(
      (d, i, arr) => arr.findIndex((x) => x.id === d.id) === i
    )
    .sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.name) - DAY_ORDER.indexOf(b.name)
    );
  dayNames.forEach((d, i) => dayIdToOrder.set(d.id, i));

  const orderedDayIds = dayNames.map((d) => d.id);
  const slotDetails = slotIds.map((sid) => {
    const e = entries.find((x) => x.timeSlotId === sid);
    if (!e) return { id: sid, startTime: "", endTime: "", slotNumber: 0 };
    const { id: _tid, ...slot } = e.timeSlot;
    return { id: sid, ...slot };
  });

  return {
    dayNames,
    orderedDayIds,
    slotDetails,
    byDay,
    slotIds,
  };
}

/** For a given day, build cell descriptors. Labs spanning 2 consecutive slots get colSpan 2. */
function getCellsForDay(
  dayId: number,
  slotIds: number[],
  byDay: Map<number, Map<number, TimetableEntry[]>>
): { colSpan: number; entries: TimetableEntry[] }[] {
  const result: { colSpan: number; entries: TimetableEntry[] }[] = [];
  for (let i = 0; i < slotIds.length; i++) {
    const slotId = slotIds[i];
    const entries = byDay.get(dayId)?.get(slotId) ?? [];
    const nextSlotId = slotIds[i + 1];
    const nextEntries = nextSlotId
      ? (byDay.get(dayId)?.get(nextSlotId) ?? [])
      : [];
    const isLabSpan =
      entries.length > 0 &&
      entries.every((e) => e.subject.isLab) &&
      nextEntries.length > 0 &&
      nextEntries.every((e) => e.subject.isLab) &&
      entries[0].subjectId === nextEntries[0].subjectId;
    if (isLabSpan) {
      result.push({ colSpan: 2, entries: [...entries, ...nextEntries] });
      i++; // skip next slot
    } else {
      result.push({ colSpan: 1, entries });
    }
  }
  return result;
}

export default function SectionTimetablePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [deptOpen, setDeptOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);
  const courseRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<TimetableEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDepartments(), getCourses(), getSections()])
      .then(([depts, crs, secs]) => {
        setDepartments(depts);
        setCourses(crs);
        setSections(secs);
      })
      .catch(() => setError("Could not load data"));
  }, []);

  useEffect(() => {
    if (!sectionId) {
      setEntries(null);
      return;
    }
    setLoading(true);
    setError(null);
    getTimetableBySection(Number(sectionId))
      .then(setEntries)
      .catch(() => {
        setError("Could not load timetable");
        setEntries(null);
      })
      .finally(() => setLoading(false));
  }, [sectionId]);

  const grid = entries && entries.length > 0 ? buildGrid(entries) : null;

  const filteredCourses = departmentId
    ? courses.filter((c) => String(c.departmentId) === departmentId)
    : [];
  const filteredSections = courseId
    ? sections.filter((s) => String(s.courseId) === courseId)
    : [];

  const selectedDepartment = departments.find(
    (d) => String(d.id) === departmentId
  );
  const selectedCourse = courses.find((c) => String(c.id) === courseId);
  const selectedSection = sections.find((s) => String(s.id) === sectionId);

  const deptSearchLower = departmentSearch.trim().toLowerCase();
  const courseSearchLower = courseSearch.trim().toLowerCase();
  const sectionSearchLower = sectionSearch.trim().toLowerCase();

  const deptOptions = deptSearchLower
    ? departments.filter((d) =>
        d.name.toLowerCase().includes(deptSearchLower)
      )
    : departments;
  const courseOptions = courseSearchLower
    ? filteredCourses.filter((c) =>
        c.name.toLowerCase().includes(courseSearchLower)
      )
    : filteredCourses;
  const sectionOptions = sectionSearchLower
    ? filteredSections.filter((s) =>
        sectionLabel(s).toLowerCase().includes(sectionSearchLower)
      )
    : filteredSections;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (deptRef.current?.contains(target)) return;
      if (courseRef.current?.contains(target)) return;
      if (sectionRef.current?.contains(target)) return;
      setDeptOpen(false);
      setCourseOpen(false);
      setSectionOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setDepartment = (id: string) => {
    setDepartmentId(id);
    setDepartmentSearch("");
    setDeptOpen(false);
    setCourseId("");
    setCourseSearch("");
    setCourseOpen(false);
    setSectionId("");
    setSectionSearch("");
    setSectionOpen(false);
  };
  const setCourse = (id: string) => {
    setCourseId(id);
    setCourseSearch("");
    setCourseOpen(false);
    setSectionId("");
    setSectionSearch("");
    setSectionOpen(false);
  };
  const setSection = (id: string) => {
    setSectionId(id);
    setSectionSearch("");
    setSectionOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-stone-500 hover:text-stone-900 text-sm font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            Section Timetable
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-600 whitespace-nowrap">
                Department
              </span>
              <div className="relative min-w-[160px]" ref={deptRef}>
                <input
                  type="text"
                  value={
                    deptOpen
                      ? departmentSearch
                      : selectedDepartment?.name ?? ""
                  }
                  onChange={(e) => {
                    setDepartmentSearch(e.target.value);
                    setDeptOpen(true);
                  }}
                  onFocus={() => setDeptOpen(true)}
                  placeholder="Search department..."
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-400"
                />
                {deptOpen && (
                  <ul className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg z-20 py-1">
                    {deptOptions.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-stone-500">
                        No departments match
                      </li>
                    ) : (
                      deptOptions.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            onClick={() => setDepartment(String(d.id))}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-100 ${
                              String(d.id) === departmentId
                                ? "bg-amber-50 font-medium"
                                : ""
                            }`}
                          >
                            {d.name}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-600 whitespace-nowrap">
                Course
              </span>
              <div className="relative min-w-[160px]" ref={courseRef}>
                <input
                  type="text"
                  value={
                    courseOpen ? courseSearch : selectedCourse?.name ?? ""
                  }
                  onChange={(e) => {
                    setCourseSearch(e.target.value);
                    setCourseOpen(true);
                  }}
                  onFocus={() => setCourseOpen(true)}
                  placeholder={
                    departmentId ? "Search course..." : "Select department first"
                  }
                  disabled={!departmentId}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-400 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {courseOpen && departmentId && (
                  <ul className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg z-20 py-1">
                    {courseOptions.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-stone-500">
                        No courses match
                      </li>
                    ) : (
                      courseOptions.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => setCourse(String(c.id))}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-100 ${
                              String(c.id) === courseId
                                ? "bg-amber-50 font-medium"
                                : ""
                            }`}
                          >
                            {c.name}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-600 whitespace-nowrap">
                Section
              </span>
              <div className="relative min-w-[220px]" ref={sectionRef}>
                <input
                  type="text"
                  value={
                    sectionOpen
                      ? sectionSearch
                      : selectedSection
                        ? sectionLabel(selectedSection)
                        : ""
                  }
                  onChange={(e) => {
                    setSectionSearch(e.target.value);
                    setSectionOpen(true);
                  }}
                  onFocus={() => setSectionOpen(true)}
                  placeholder={
                    courseId ? "Search section..." : "Select course first"
                  }
                  disabled={!courseId}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-400 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {sectionOpen && courseId && (
                  <ul className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg z-20 py-1">
                    {sectionOptions.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-stone-500">
                        No sections match
                      </li>
                    ) : (
                      sectionOptions.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSection(String(s.id))}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-100 ${
                              String(s.id) === sectionId
                                ? "bg-amber-50 font-medium"
                                : ""
                            }`}
                          >
                            {sectionLabel(s)}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {sectionId && loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}

        {sectionId && !loading && entries && entries.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-500">
            No timetable entries for this section yet.
          </div>
        )}

        {grid && (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-24 min-w-24 border-b border-r border-stone-200 bg-stone-100 px-3 py-3 text-left font-semibold text-stone-700">
                    Day
                  </th>
                  {grid.slotDetails.map((slot) => (
                    <th
                      key={slot.id}
                      className="min-w-28 border-b border-r last:border-r-0 border-stone-200 bg-stone-100 px-3 py-3 text-center font-semibold text-stone-700 whitespace-nowrap"
                    >
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.dayNames.map((d) => {
                  const cells = getCellsForDay(d.id, grid.slotIds, grid.byDay);
                  return (
                    <tr key={d.id}>
                      <td className="border-b border-r border-stone-200 bg-stone-50 px-3 py-2 font-medium text-stone-600 capitalize">
                        {d.name.slice(0, 3)}
                      </td>
                      {cells.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          colSpan={cell.colSpan}
                          className="border-b border-r last:border-r-0 border-stone-200 p-2 align-top min-h-16"
                        >
                          {cell.entries.length === 0 ? (
                            <span className="block py-4 text-stone-400 text-center text-xs">
                              —
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {cell.entries
                                .filter(
                                  (e, i, arr) =>
                                    i === 0 ||
                                    e.subjectId !== arr[0].subjectId
                                )
                                .map((e) => (
                                  <div
                                    key={e.id}
                                    className="rounded-lg border border-stone-300 bg-stone-100 p-2"
                                  >
                                    <div className="font-semibold text-stone-800">
                                      {e.subject.name}
                                      {e.subject.isLab && (
                                        <span className="ml-1 text-xs font-normal text-stone-500">
                                          (Lab)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-stone-600">
                                      {e.faculty.user.name}
                                    </div>
                                    <div className="text-xs text-stone-500">
                                      {e.room.name}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
