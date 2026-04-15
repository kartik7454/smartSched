"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TimetableEntry = any;

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

// --- SLOT TEMPLATE: always show these! (each slot is 1 hour) ---
const SLOT_TEMPLATE = [
  { slotNumber: 1, startTime: "09:00", endTime: "10:00" },
  { slotNumber: 2, startTime: "10:00", endTime: "11:00" },
  { slotNumber: 3, startTime: "11:00", endTime: "12:00" },
  { slotNumber: 4, startTime: "12:00", endTime: "13:00" },
  { slotNumber: 5, startTime: "13:00", endTime: "14:00" },
  { slotNumber: 6, startTime: "14:00", endTime: "15:00" },
  { slotNumber: 7, startTime: "15:00", endTime: "16:00" },
];
// ---

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

// Build grid such that labs take up 2 consecutive slots (colSpan=2)
// Assumes: If an entry isLab, it occupies its own slot and the next slot, merging columns.
function buildGrid(entries: TimetableEntry[]) {
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

  // Always use slot template
  const slotDetails = SLOT_TEMPLATE.map((slot) => ({
    id: slot.slotNumber,
    startTime: slot.startTime,
    endTime: slot.endTime,
    slotNumber: slot.slotNumber,
  }));

  const slotIds = SLOT_TEMPLATE.map((slot) => slot.slotNumber);

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

// Return an array of slots for rendering row for a given day
// If lab is found at a slot, it spans 2 cells and marks next as skipped
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

export default function MyTimetablePage() {
  const router = useRouter();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimetable() {
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
        const res = await fetch(
          `http://localhost:3000/users/${user.userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        const res2 = await fetch(
          `http://localhost:3000/timetables/section/${data.student.sectionId}`,
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

    fetchTimetable();
  }, [router]);

  if (loading) return <div className="p-6 bg-white text-black">Loading...</div>;
  if (error) return <div className="p-6 text-red-500 bg-white text-black">{error}</div>;
  if (!entries.length) return <div className="p-6 bg-white text-black">No timetable</div>;

  const grid = buildGrid(entries);

  return (
    <div className="p-6 bg-white text-black">
      <h1 className="text-xl font-semibold mb-4">My Timetable</h1>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm bg-white text-black">
          <thead>
            <tr>
              <th className="w-24 border-b border-r px-3 py-3 text-left bg-gray-50 text-black">
                Day
              </th>

              {/* Render slot headers - need to skip columns when labs are present. So, use slotDetails but don't skip header cells. */}
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
              // calculate how many logical slots are rendered (should total slotIds.length)
              let slotIndex = 0;
              return (
                <tr key={d.id}>
                  <td className="border-b border-r px-3 py-2 font-medium bg-white text-black">
                    {d.name.slice(0, 3)}
                  </td>

                  {cells.map((cell: any, i: number) => {
                    // If this cell is a lab, increase slotIndex by 2; else by 1
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