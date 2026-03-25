"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TimetableEntry = {
  id: number;
  sectionId: number | null;
  subjectId: number;
  facultyId: number;
  roomId: number;
  dayId: number;
  timeSlotId: number;
  subject: { id: number; name: string; isLab: boolean };
  faculty: { id: number; user: { name: string } };
  room: { id: number; name: string; roomType: string };
  day: { id: number; name: string };
  timeSlot: { id: number; startTime: string; endTime: string; slotNumber: number };
  section?: {
    id: number;
    name: string;
    semester: number;
    course?: { id: number; name: string };
  };
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const HOD_ROLE_ID = 4;

type UserData = {
  userId: number;
  role: number | string;
};

async function getUserFromToken(): Promise<UserData | null> {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(
      atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
    );

    return {
      userId: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
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
    const { id: _id, ...timeSlotRest } = e!.timeSlot;
    return { id: sid, ...timeSlotRest };
  });

  return {
    dayNames,
    slotDetails,
    byDay,
    slotIds,
  };
}

function getCellsForDay(dayId: number, slotIds: number[], byDay: any) {
  const result: any[] = [];

  for (let i = 0; i < slotIds.length; i++) {
    const slotId = slotIds[i];
    const entries = byDay.get(dayId)?.get(slotId) ?? [];
    result.push({ colSpan: 1, entries });
  }

  return result;
}

function sectionLabel(entry: TimetableEntry) {
  const s = entry.section;
  if (!s) return "Unknown";
  return `${s.course?.name ?? "Course"} · Sem ${s.semester} ${s.name}`;
}

export default function GenerateTimetablePage() {
  const router = useRouter();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  async function fetchTimetables(deptId: number) {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(
      `${API_BASE}/timetables/department/${deptId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) {
      const data = await res.json();
      setEntries(data);
    } else {
      setEntries([]);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);

      const user = await getUserFromToken();

      if (!user || Number(user.role) !== HOD_ROLE_ID) {
        setError("Unauthorized. Only HOD can access this page.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/users/${user.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!data.departmentId || !data.department) {
          setError("Your account is not linked to a department.");
          setLoading(false);
          return;
        }

        setDepartmentId(data.departmentId);
        setDepartmentName(data.department.name);

        await fetchTimetables(data.departmentId);
      } catch (err: any) {
        setError(err.message || "Error loading data.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleGenerate() {
    if (!departmentId) return;

    setGenerating(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/time-table-generator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deptId: departmentId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || result.error || "Failed to generate timetable");
      }

      await fetchTimetables(departmentId);
    } catch (err: any) {
      setError(err.message || "Error generating timetable.");
    } finally {
      setGenerating(false);
    }
  }

  const entriesBySection = entries.reduce<Record<number, TimetableEntry[]>>(
    (acc, e) => {
      const sid = e.sectionId ?? 0;
      if (!acc[sid]) acc[sid] = [];
      acc[sid].push(e);
      return acc;
    },
    {}
  );

  const sectionIds = Object.keys(entriesBySection)
    .map(Number)
    .sort((a, b) => {
      const aLabel = sectionLabel(entriesBySection[a][0]);
      const bLabel = sectionLabel(entriesBySection[b][0]);
      return aLabel.localeCompare(bLabel);
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !departmentId) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 text-sm font-medium mb-4 inline-block"
          >
            ← Back
          </Link>
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 px-6 py-4">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <header className="sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-300 text-sm font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            Generate Timetable
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Your department
              </p>
              <p className="text-lg font-semibold text-stone-800 dark:text-stone-200">
                {departmentName}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center gap-2"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                "Generate Timetable"
              )}
            </button>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Department Timetables</h2>

        {sectionIds.length === 0 ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-12 text-center text-stone-500 dark:text-stone-400">
            No timetables generated yet. Click &quot;Generate Timetable&quot; to create
            timetables for your department.
          </div>
        ) : (
          <div className="space-y-8">
            {sectionIds.map((sectionId) => {
              const sectionEntries = entriesBySection[sectionId];
              const grid = buildGrid(sectionEntries);
              const label = sectionLabel(sectionEntries[0]);

              return (
                <div
                  key={sectionId}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 font-semibold text-stone-800 dark:text-stone-200">
                    {label}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="w-24 border-b border-r border-stone-200 dark:border-stone-700 px-3 py-3 text-left font-semibold text-stone-700 dark:text-stone-300">
                            Day
                          </th>
                          {grid.slotDetails.map((slot: any) => (
                            <th
                              key={slot.id}
                              className="border-b border-r border-stone-200 dark:border-stone-700 px-3 py-3 text-center font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap"
                            >
                              {formatTime(slot.startTime)} –{" "}
                              {formatTime(slot.endTime)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grid.dayNames.map((d: any) => {
                          const cells = getCellsForDay(
                            d.id,
                            grid.slotIds,
                            grid.byDay
                          );

                          return (
                            <tr key={d.id}>
                              <td className="border-b border-r border-stone-200 dark:border-stone-700 px-3 py-2 font-medium text-stone-600 dark:text-stone-400">
                                {d.name.slice(0, 3)}
                              </td>

                              {cells.map((cell: any, i: number) => (
                                <td
                                  key={i}
                                  className="border-b border-r border-stone-200 dark:border-stone-700 p-2 align-top"
                                >
                                  {cell.entries.length === 0 ? (
                                    <span className="text-stone-400 dark:text-stone-500 text-xs block text-center py-4">
                                      —
                                    </span>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      {cell.entries.map((e: any) => (
                                        <div
                                          key={e.id}
                                          className="rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800/80 p-2"
                                        >
                                          <div className="font-semibold text-stone-800 dark:text-stone-200">
                                            {e.subject.name}
                                            {e.subject.isLab && (
                                              <span className="text-xs ml-1 font-normal">
                                                (Lab)
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-stone-600 dark:text-stone-400">
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
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
