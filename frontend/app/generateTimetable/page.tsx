"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/apiBase";


// Simple section type for list
type SectionInfo = {
  id: number;
  name: string;
  semester?: number;
  course?: { id: number; name: string };
};

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

function sectionLabelFromSectionInfo(section: SectionInfo) {
  // Try to make a user-friendly label for a section
  return `${section.course?.name ?? "Course"} ·${section.semester ? " Sem " + section.semester : ""} ${section.name}`;
}
function sectionLabel(entry: TimetableEntry) {
  const s = entry.section;
  if (!s) return "Unknown";
  return `${s.course?.name ?? "Course"} · Sem ${s.semester} ${s.name}`;
}

// Delete timetable rows for one section (callers update React state after success)
async function removeManyBySectionId(
  sectionId: number,
  apiBase: string,
  departmentId: number | null
) {
  if (!sectionId || !apiBase || !departmentId) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${apiBase}/timetables/section/${sectionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete timetable entries for section", sectionId);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error deleting timetable entries for section", sectionId, e);
  }
}

// Helper: fetch ONLY the sections for a department
async function fetchSectionsListByDepartmentId(deptId: number, API_BASE: string): Promise<SectionInfo[]> {
  const token = localStorage.getItem("token");
  if (!token || !API_BASE) return [];
  try {
    // Assume we have a dedicated API route e.g. /sections/department/:id 
    // that returns array of sections: [{id, name, semester, course:{id,name}}]
    const res = await fetch(`${API_BASE}/sections?departmentId=${deptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      // Defensive typing
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error fetching sections list for department", deptId, e);
  }
  return [];
}

// --- Helper: Fetch timetable entries for a single section ---
async function fetchTimetableBySectionId(sectionId: number, API_BASE: string) {
  const token = localStorage.getItem("token");
  if (!token || !API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/timetables/section/${sectionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error fetching timetable by section:", sectionId, e);
  }
  return [];
}

export default function GenerateTimetablePage() {
  const router = useRouter();

  // Now we only store sections info, not timetable entries for all
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [sectionEntries, setSectionEntries] = useState<{
    [sectionId: number]: TimetableEntry[] | undefined;
  }>({});
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [loadingSections, setLoadingSections] = useState(true); // loading flag for sections list

  // Loading state for section timetable (per section)
  const [sectionLoading, setSectionLoading] = useState<{ [sectionId: number]: boolean }>({});
  
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [removingSection, setRemovingSection] = useState<number | null>(null);

  // Fetch only section list for department
  async function fetchSectionsList() {
    if (!departmentId) return;
    setLoadingSections(true);
    try {
      const sectionArr = await fetchSectionsListByDepartmentId(departmentId, API_BASE);
      setSections(sectionArr ?? []);
      // Optional: clean stale entries
      setSectionEntries((prev) => {
        const next: typeof prev = {};
        sectionArr.forEach((s) => {
          if (prev[s.id]) next[s.id] = prev[s.id];
        });
        return next;
      });
    } catch (e) {
      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  }

  useEffect(() => {
    async function init() {
      setLoadingSections(true);
      setError(null);
      setSections([]);
      setSectionEntries({});
      setExpandedSection(null);

      const user = await getUserFromToken();

      if (!user || Number(user.role) !== HOD_ROLE_ID) {
        setError("Unauthorized. Only HOD can access this page.");
        setLoadingSections(false);
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
          setLoadingSections(false);
          return;
        }

        setDepartmentId(data.departmentId);
        setDepartmentName(data.department.name);

        await fetchSectionsListByDepartmentId(data.departmentId, API_BASE)
          .then((sectionArr) => {
            setSections(sectionArr ?? []);
          });
      } catch (err: any) {
        setError(err.message || "Error loading data.");
      } finally {
        setLoadingSections(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Refetch sections list after generating!
      await fetchSectionsList();
      setSectionEntries({});
      setExpandedSection(null);
    } catch (err: any) {
      setError(err.message || "Error generating timetable.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRemoveAll() {
    if (!departmentId) return;
    setRemovingAll(true);
    setError(null);

    try {
      for( let i =0 ; i<sections.length;i++ ){
        console.log(sections[i].id)
        await removeManyBySectionId(sections[i].id, API_BASE, departmentId);
      }
      
      // Remove from UI as well
      setSections([]);
      setSectionEntries({});
      setExpandedSection(null);
    } catch (err: any) {
      setError(err.message || "Error deleting all timetables.");
    } finally {
      setRemovingAll(false);
    }
  }

  async function handleToggleSection(sectionId: number) {
    setError(null);
    if (expandedSection === sectionId) {
      setExpandedSection(null);
      return;
    }
    setExpandedSection(sectionId);
    // Only fetch timetable entries for this section if not loaded already
    if (!sectionEntries[sectionId]) {
      setSectionLoading((prev) => ({ ...prev, [sectionId]: true }));
      const fetched = await fetchTimetableBySectionId(sectionId, API_BASE);
      setSectionEntries((prev) => ({
        ...prev,
        [sectionId]: fetched || [],
      }));
      setSectionLoading((prev) => ({ ...prev, [sectionId]: false }));
    }
  }

  async function handleRemoveSection(sectionId: number) {
    setRemovingSection(sectionId);
    try {
      await removeManyBySectionId(sectionId, API_BASE, departmentId);
      // Remove from UI section list and timetable cache
      setSections((old) => old.filter((s) => s.id !== sectionId));
      setSectionEntries((old) => {
        const next = { ...old };
        delete next[sectionId];
        return next;
      });
      if (expandedSection === sectionId) setExpandedSection(null);
    } catch (e) {
      // nothing, error shown elsewhere
    } finally {
      setRemovingSection(null);
    }
  }

  if (loadingSections) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !departmentId) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back
          </Link>
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-6 py-4">
            {error}
          </div>
        </div>
      </div>
    );
  }

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
            Generate Timetable
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-stone-200 bg-white shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-sm text-stone-500">
                Your department
              </p>
              <p className="text-lg font-semibold text-stone-800">
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
            <button
              onClick={handleRemoveAll}
              disabled={removingAll || sections.length === 0}
              className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center gap-2"
              title="Remove all timetable entries for this department"
            >
              {removingAll ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Removing...
                </>
              ) : (
                "Remove All"
              )}
            </button>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Department Timetables</h2>
        {sections.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-500">
            No timetables generated yet. Click &quot;Generate Timetable&quot; to create
            timetables for your department.
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => {
              const isExpanded = expandedSection === section.id;
              const entries = sectionEntries[section.id];
              const isLoadingThisSection = !!sectionLoading[section.id];
              return (
                <div
                  key={section.id}
                  className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden"
                >
                  <div
                    className={`w-full flex items-center justify-between px-4 py-3 bg-stone-100 border-b border-stone-200 font-semibold text-stone-800 hover:bg-amber-50 focus:outline-none transition cursor-pointer text-left`}
                    role="button"
                    onClick={() => handleToggleSection(section.id)}
                    aria-expanded={isExpanded}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleToggleSection(section.id);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                        style={{
                          display: "inline-block",
                          transformOrigin: "center center",
                        }}
                      >
                        ▶
                      </span>
                      {sectionLabelFromSectionInfo(section)}
                    </span>
                    <div className="flex items-center">
                      <Link
                        href={`/timetable/${section.id}`}
                        onClick={e => e.stopPropagation()}
                        className="ml-2 px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                        title="Edit timetable for this section"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={removingSection === section.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSection(section.id);
                        }}
                        className="ml-2 px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-60"
                        title="Remove all timetable entries for this section"
                      >
                        {removingSection === section.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="overflow-x-auto animate-fadeIn">
                      {isLoadingThisSection ? (
                        <div className="py-12 text-center">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent inline-block" />
                        </div>
                      ) : !entries ? (
                        <div className="py-12 text-center">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent inline-block" />
                        </div>
                      ) : entries.length === 0 ? (
                        <div className="text-center py-6 text-stone-500 text-sm">
                          No timetable entries for this section.
                        </div>
                      ) : (
                        (() => {
                          const grid = buildGrid(entries);
                          return (
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr>
                                  <th className="w-24 border-b border-r border-stone-200 px-3 py-3 text-left font-semibold text-stone-700">
                                    Day
                                  </th>
                                  {grid.slotDetails.map((slot: any) => (
                                    <th
                                      key={slot.id}
                                      className="border-b border-r border-stone-200 px-3 py-3 text-center font-semibold text-stone-700 whitespace-nowrap"
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
                                      <td className="border-b border-r border-stone-200 px-3 py-2 font-medium text-stone-600">
                                        {d.name.slice(0, 3)}
                                      </td>
                                      {cells.map((cell: any, i: number) => (
                                        <td
                                          key={i}
                                          className="border-b border-r border-stone-200 p-2 align-top"
                                        >
                                          {cell.entries.length === 0 ? (
                                            <span className="text-stone-400 text-xs block text-center py-4">
                                              —
                                            </span>
                                          ) : (
                                            <div className="flex flex-col gap-1">
                                              {cell.entries.map((e: any) => (
                                                <div
                                                  key={e.id}
                                                  className="rounded-lg border border-stone-300 bg-stone-100 p-2"
                                                >
                                                  <div className="font-semibold text-stone-800">
                                                    {e.subject.name}
                                                    {e.subject.isLab && (
                                                      <span className="text-xs ml-1 font-normal">
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
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
