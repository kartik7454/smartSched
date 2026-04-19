"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef } from "react";
import {
  type Faculty,
  type TimetableEntry,
  DAY_ORDER,
  type Department,
} from "@/types/timetable";
import { getFaculty, getTimetableByFaculty, getDepartments } from "@/lib/api";
import Link from "next/link";

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

  const dayNames = entries
    .map((e) => ({ id: e.day.id, name: e.day.name }))
    .filter(
      (d, i, arr) => arr.findIndex((x) => x.id === d.id) === i
    )
    .sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.name) - DAY_ORDER.indexOf(b.name)
    );

  const slotDetails = slotIds.map((sid) => {
    const e = entries.find((x) => x.timeSlotId === sid);
    if (!e) return { id: sid, startTime: "", endTime: "", slotNumber: 0 };
    const { id: _tid, ...slot } = e.timeSlot;
    return { id: sid, ...slot };
  });

  return {
    dayNames,
    slotDetails,
    byDay,
    slotIds,
  };
}

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
      i++;
    } else {
      result.push({ colSpan: 1, entries });
    }
  }
  return result;
}

function sectionLabel(e: TimetableEntry): string {
  const s = e.section;
  if (!s) return "—";
  const course = s.course?.name ?? "";
  return course
    ? `${course} · Sem ${s.semester} ${s.name}`
    : `Sem ${s.semester} ${s.name}`;
}

export default function TeacherTimetablePage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [facultyId, setFacultyId] = useState<string>("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherOpen, setTeacherOpen] = useState(false);
  const teacherRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<TimetableEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFaculty(), getDepartments()])
      .then(([faculties, departments]) => {
        setFacultyList(faculties);
        setDepartmentList(departments);
      })
      .catch(() => setError("Could not load initial data"));
  }, []);

  useEffect(() => {
    if (!facultyId) {
      setEntries(null);
      return;
    }
    setLoading(true);
    setError(null);
    getTimetableByFaculty(Number(facultyId))
      .then(setEntries)
      .catch(() => {
        setError("Could not load timetable");
        setEntries(null);
      })
      .finally(() => setLoading(false));
  }, [facultyId]);

  const grid = entries && entries.length > 0 ? buildGrid(entries) : null;

  const filteredFaculty = selectedDepartmentId
    ? facultyList.filter(
        (f) => String(f.department?.id) === selectedDepartmentId
      )
    : facultyList;

  const selectedTeacher = facultyList.find((f) => String(f.id) === facultyId);
  const teacherSearchLower = teacherSearch.trim().toLowerCase();
  const teacherOptions = teacherSearchLower
    ? filteredFaculty.filter((f) =>
        (f.user?.name ?? "").toLowerCase().includes(teacherSearchLower)
      )
    : filteredFaculty;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (teacherRef.current?.contains(target)) return;
      setTeacherOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Force light theme at the page root
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" data-theme="light">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-stone-500 hover:text-stone-900 text-sm font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            Teacher Timetable
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-600 whitespace-nowrap">
                Department
              </span>
              <div className="relative min-w-[220px]">
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setFacultyId("");
                    setTeacherSearch("");
                    setTeacherOpen(false);
                  }}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All Departments</option>
                  {departmentList.map((dept) => (
                    <option key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-600 whitespace-nowrap">
                Teacher
              </span>
              <div className="relative min-w-[220px]" ref={teacherRef}>
                <input
                  type="text"
                  value={
                    teacherOpen
                      ? teacherSearch
                      : selectedTeacher?.user?.name ?? ""
                  }
                  onChange={(e) => {
                    setTeacherSearch(e.target.value);
                    setTeacherOpen(true);
                  }}
                  onFocus={() => setTeacherOpen(true)}
                  placeholder="Search teacher..."
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-400"
                />
                {teacherOpen && (
                  <ul className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg z-20 py-1">
                    {teacherOptions.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-stone-500">
                        No teachers match
                      </li>
                    ) : (
                      teacherOptions.map((f) => (
                        <li key={f.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setFacultyId(String(f.id));
                              setTeacherSearch("");
                              setTeacherOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-100 ${
                              String(f.id) === facultyId
                                ? "bg-amber-50 font-medium"
                                : ""
                            }`}
                          >
                            {f.user?.name ?? `Teacher #${f.id}`}
                            {f.department?.name && (
                              <span className="ml-1 text-stone-500 text-xs">
                                · {f.department.name}
                              </span>
                            )}
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

        {facultyId && loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}

        {facultyId && !loading && entries && entries.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-500">
            No timetable entries for this teacher yet.
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
                                    e.subjectId !== arr[0].subjectId ||
                                    e.sectionId !== arr[0].sectionId
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
                                      {sectionLabel(e)}
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
