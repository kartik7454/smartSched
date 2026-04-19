"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/apiBase";

type TimetableEntry = any;
type SlotType = {
  id: number;
  slotNumber: number;
  startTime: string;
  endTime: string;
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

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

// buildGrid now takes slots from DB instead of SLOT_TEMPLATE
function buildGrid(entries: TimetableEntry[], slotsFromDb: SlotType[]) {
  const uniqueDaysMap = new Map<string, number>();
  entries.forEach((e: any) => {
    if (!uniqueDaysMap.has(e.day.name)) uniqueDaysMap.set(e.day.name, e.day.id);
  });

  // Determine the stable ordered day list for display
  const allDays = DAY_ORDER.map((dayName, idx) =>
    uniqueDaysMap.has(dayName)
      ? { id: uniqueDaysMap.get(dayName)!, name: dayName }
      : { id: -1000 - idx, name: dayName }
  );

  // Use slots from database!
  const slotDetails = slotsFromDb
    .map(slot => ({
      id: slot.slotNumber,
      slotNumber: slot.slotNumber,
      startTime: slot.startTime,
      endTime: slot.endTime
    }))
    .sort((a, b) => a.slotNumber - b.slotNumber);

  const slotIds = slotDetails.map(slot => slot.slotNumber);

  // Map (dayId:slotNumber) to entries[]
  const cellMap = new Map<string, TimetableEntry[]>();
  for (const e of entries) {
    // Accommodate both possible keys (slotNumber or timeSlot.slotNumber)
    const slotNum =
      (e.timeSlot && (e.timeSlot.slotNumber ?? e.timeSlot.timeSlotNumber)) ??
      e.timeSlotNumber ??
      e.timeSlotId;
    const key = `${e.dayId}:${slotNum}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key)!.push(e);
  }

  return {
    dayNames: allDays,
    slotDetails,
    slotIds,
    cellMap,
  };
}

// as before
function getCellsForDay(dayId: number, slotIds: number[], cellMap: Map<string, TimetableEntry[]>) {
  const result: any[] = [];
  let skip = 0;

  for (let i = 0; i < slotIds.length; i++) {
    if (skip > 0) {
      skip--;
      continue;
    }
    const slotNumber = slotIds[i];
    const key = `${dayId}:${slotNumber}`;
    const entries = cellMap.get(key) ?? [];
    // If any entry is a lab, colSpan=2
    const labEntry = entries.find(
      (e: any) => e.subject && e.subject.isLab
    );
    if (labEntry) {
      result.push({ colSpan: 2, entries: [labEntry] });
      skip = 1; // skip the next slot
    } else {
      result.push({ colSpan: 1, entries });
    }
  }
  return result;
}

// LoadingAnimation component
function LoadingAnimation() {
  // Tailwind CSS spinner
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <svg
        className="animate-spin h-10 w-10 text-blue-500 mb-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      <span className="text-blue-700 font-semibold text-lg">Loading...</span>
    </div>
  );
}

export default function MyTimetablePage() {
  const router = useRouter();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [slots, setSlots] = useState<SlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimetableAndSlots() {
      setLoading(true);
      setError(null);

      const user = await getUserFromToken();

      if (!user || user.role !== 3) {
        setError("Unauthorized");
        alert("no")
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Get user (to get section id)
        const res = await fetch(
          `${API_BASE}/users/${user.userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        // Get slots from DB!
        const slotRes = await fetch(`${API_BASE}/time-slots`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const slotData = await slotRes.json();
        setSlots(slotData);

        // Get timetable for student's section
        const res2 = await fetch(
          `${API_BASE}/timetables/section/${data.student.sectionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const timetableData = await res2.json();
        setEntries(timetableData);
      } catch (err: any) {
        setError(err.message || "Error fetching timetable.");
      } finally {
        setLoading(false);
      }
    }

    fetchTimetableAndSlots();
  }, [router]);

  if (loading)
    return (
      <div className="p-6 bg-white text-black flex items-center justify-center min-h-60">
        <LoadingAnimation />
      </div>
    );
  if (error) return <div className="p-6 text-red-500 bg-white text-black">{error}</div>;
  if (!entries.length) return <div className="p-6 bg-white text-black">No timetable</div>;
  if (!slots.length) return <div className="p-6 bg-white text-black">No slots defined</div>;

  const grid = buildGrid(entries, slots);

  return (
    <div className="p-6 bg-white text-black">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 11h18" />
          </svg>
          <h1 className="text-2xl font-bold tracking-wide text-blue-800 drop-shadow-sm text-center">My Timetable</h1>
        </div>
      </div>
 

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm mx-2 md:mx-6">
        <table className="w-full border-collapse text-sm bg-white text-black">
          <thead>
            <tr>
              <th className="w-24 border-b border-r px-3 py-3 text-left bg-gray-50 text-black">
                Day
              </th>
              {/* Render slot headers dynamically from slot details fetched from DB */}
              {grid.slotDetails.map((slot: any) => (
                <th
                  key={slot.id}
                  className="border-b border-r px-3 py-3 text-center bg-gray-50 text-black"
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
                grid.cellMap
              );
              let slotIndex = 0;
              return (
                <tr key={d.id}>
                  <td className="border-b border-r px-3 py-2 font-medium bg-white text-black">
                    {d.name.slice(0, 3)}
                  </td>

                  {cells.map((cell: any, i: number) => {
                    const cellKey = `${d.id}-slot-${slotIndex}`;
                    slotIndex += cell.colSpan;
                    return (
                      <td
                        key={cellKey}
                        colSpan={cell.colSpan}
                        className="border-b border-r p-2 align-top bg-white text-black"
                      >
                        {cell.entries.length === 0 ? (
                          <span className="text-gray-400 text-xs block text-center py-4">
                            —
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {cell.entries.map((e: any) => (
                              <div
                                key={e.id}
                                className={`rounded-lg border border-gray-300 bg-gray-100 p-2 ${e.subject.isLab ? "bg-blue-50" : ""}`}
                              >
                                <div className="font-semibold">
                                  {e.subject.name}
                                  {e.subject.isLab && (
                                    <span className="text-xs ml-1">
                                      (Lab - 2 slots)
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs">
                                  {e.faculty.user.name}
                                </div>

                                <div className="text-xs text-gray-500">
                                  {e.room.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}