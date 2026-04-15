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

  const orderedDayIds = dayNames.map((d) => d.id);

  const slotDetails = slotIds.map((sid) => {
    const e = entries.find((x) => x.timeSlotId === sid);
    return { id: sid, ...e.timeSlot };
  });

  return {
    dayNames,
    orderedDayIds,
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

      if (!user || user.role !== 2) {
        setError("Unauthorized");
        alert("not teachers")
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
console.log("data",data)
        const res2 = await fetch(
          `http://localhost:3000/timetables/faculty/${data.faculty.id}`,
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!entries.length) return <div className="p-6">No timetable</div>;

  const grid = buildGrid(entries);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">My Timetable</h1>

      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-24 border-b border-r px-3 py-3 text-left">
                Day
              </th>

              {grid.slotDetails.map((slot: any) => (
                <th
                  key={slot.id}
                  className="border-b border-r px-3 py-3 text-center"
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
                  <td className="border-b border-r px-3 py-2 font-medium">
                    {d.name.slice(0, 3)}
                  </td>

                  {cells.map((cell: any, i: number) => (
                    <td
                      key={i}
                      className="border-b border-r p-2 align-top"
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
                              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-2"
                            >
                              <div className="font-semibold">
                                {e.subject.name}
                                {e.subject.isLab && (
                                  <span className="text-xs ml-1">
                                    (Lab)
                                  </span>
                                )}
                              </div>

                              <div className="text-xs">
                                {e.section.course.name}, Sem {e.section.semester}, {e.section.name}
                              </div>

                              <div className="text-xs text-gray-500">
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
}