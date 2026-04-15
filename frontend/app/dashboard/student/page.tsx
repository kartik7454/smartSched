"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TimetableEntry = {
  id: number;
  subject: { id: number; name: string; isLab: boolean };
  faculty: { id: number; user: { name: string } };
  room: { id: number; name: string; roomType: string };
  day: { id: number; name: string };
  timeSlot: {
    id: number;
    startTime: string;
    endTime: string;
    slotNumber: number;
  };
  section?: {
    id: number;
    name: string;
    semester: number;
    course?: { id: number; name: string };
  };
};

type UserData = {
  userId: number;
  role: number | string;
  sectionId?: number;
  name?: string;
};

type Section = {
  id: number;
  name: string;
  semester: number;
  course?: { id: number; name: string };
};

type UpcomingClass = {
  entry: TimetableEntry;
  startTime: string;
  endTime: string;
  dayName: string;
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const SLOT_TEMPLATE = [
  { slotNumber: 1, startTime: "09:00", endTime: "10:00" },
  { slotNumber: 2, startTime: "10:00", endTime: "11:00" },
  { slotNumber: 3, startTime: "11:00", endTime: "12:00" },
  { slotNumber: 4, startTime: "12:00", endTime: "13:00" },
  { slotNumber: 5, startTime: "13:00", endTime: "14:00" },
  { slotNumber: 6, startTime: "14:00", endTime: "15:00" },
  { slotNumber: 7, startTime: "15:00", endTime: "16:00" },
];

// Helper function for time formatting
function formatTime(s: string) {
  if (!s) return "";
  const [h, m] = s.split(":").map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

// Helper for adding days to a date (for next-day class time calculation)
function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Calculate time difference string, returns e.g. "1 hr 20 min" or "5 min"
function getTimeDiffString(from: Date, to: Date) {
  let ms = to.getTime() - from.getTime();
  if (ms < 0) ms = 0;
  const minutes = Math.floor(ms / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let result = "";
  if (hours > 0) result += `${hours} hr${hours > 1 ? "s" : ""}${mins > 0 ? " " : ""}`;
  if (mins > 0 || hours === 0) result += `${mins} min`;
  return result;
}

// Simulate get user from token (should be improved for production)
async function getUserFromToken(): Promise<UserData | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(
      atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
    );
    // We assume 'sectionId' is present for student tokens
    return {
      userId: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// Fetch section info for profile card
async function fetchSection(sectionId: number): Promise<Section | null> {
  try {
    const res = await fetch(`/api/section/${sectionId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Fetch timetable entries for a section
async function fetchTimetable(sectionId: number): Promise<TimetableEntry[]> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(
    `http://localhost:3000/timetables/section/${sectionId}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );
  if (!res.ok) return [];
  return await res.json();
}

// Compute next/upcoming class
function getUpcomingClass(
  timetable: TimetableEntry[]
): UpcomingClass | null {
  const now = new Date();
  // Day and time logic (in local time)
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const todayName = days[now.getDay()];
  const todayEntries = timetable.filter((e) => e.day.name === todayName);
  // Sort by slot number ascending
  const sorted = todayEntries.sort(
    (a, b) => (a.timeSlot.slotNumber ?? 0) - (b.timeSlot.slotNumber ?? 0)
  );
  // Find next slot that hasn't started yet
  for (let entry of sorted) {
    // Format: "HH:MM" to local date
    const [hh, mm] = entry.timeSlot.startTime.split(":").map(Number);
    const classStart = new Date(now);
    classStart.setHours(hh, mm, 0, 0);
    if (classStart > now) {
      return {
        entry,
        startTime: entry.timeSlot.startTime,
        endTime: entry.timeSlot.endTime,
        dayName: todayName,
      };
    }
  }
  // If none left today, look to next available class in the week
  const weekIndex = DAY_ORDER.indexOf(todayName);
  for (let offset = 1; offset < 7; ++offset) {
    let nextDayIdx = (weekIndex + offset) % 5; // Only MON-FRI
    if (nextDayIdx >= DAY_ORDER.length) continue;
    const dn = DAY_ORDER[nextDayIdx];
    const entries = timetable.filter((e) => e.day.name === dn);
    if (entries.length) {
      const classEntry = entries.sort(
        (a, b) => (a.timeSlot.slotNumber ?? 0) - (b.timeSlot.slotNumber ?? 0)
      )[0];
      return {
        entry: classEntry,
        startTime: classEntry.timeSlot.startTime,
        endTime: classEntry.timeSlot.endTime,
        dayName: dn,
      };
    }
  }
  return null;
}

function StudentDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // For showing live countdown to class
  const [classTimeLeft, setClassTimeLeft] = useState<string | null>(null);

  // Recalculate time every 30 seconds if upcoming class exists
  useEffect(() => {
    if (!timetable || timetable.length === 0) return;
    let timeoutId: NodeJS.Timeout | null = null;

    function updateTimeLeft() {
      const nextUp = getUpcomingClass(timetable);
      if (!nextUp) {
        setClassTimeLeft(null);
      } else {
        // Get the Date object for the class start time (may be on another day)
        const now = new Date();
        let nextClassDate = new Date(now);
        const daysArr = [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
        ];
        const todayNum = now.getDay();
        const classDayNum = daysArr.indexOf(nextUp.dayName);

        // If classDayNum comes after today, add that many days
        let daysToAdd = classDayNum - todayNum;
        if (daysToAdd < 0) {
          daysToAdd += 7;
        }
        nextClassDate = addDays(now, daysToAdd);

        // Set to class start time
        const [h, m] = nextUp.startTime.split(":").map(Number);
        nextClassDate.setHours(h, m, 0, 0);

        setClassTimeLeft(getTimeDiffString(now, nextClassDate));
      }
    }

    updateTimeLeft();
    // Only update every 30 seconds
    timeoutId = setInterval(updateTimeLeft, 30000);

    return () => {
      if (timeoutId) clearInterval(timeoutId);
    };
  }, [timetable]);

  useEffect(() => {
    (async () => {
      const u = await getUserFromToken();
      let student = null;
      if (u && u.userId) {
        try {
          const res = await fetch(
            `http://localhost:3000/students/user/${u.userId}`,
            {
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            }
          );
          if (res.ok) {
            student = await res.json();
            setUser(student.user);
            setSection(student.section || null);
            const t = await fetchTimetable(student.section.id);
            setTimetable(t);
          }
        } catch (e) {
          // Optionally handle error
        }
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: "#fafbfb" }}>
        <div className="text-lg text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center mt-10" style={{ backgroundColor: "#fafbfb" }}>
        <div className="text-lg font-bold text-zinc-900">Not logged in as student.</div>
        <Link href="/" className="text-blue-600 hover:underline mt-4">
          Back to Home
        </Link>
      </div>
    );
  }

  // Get classes summary statistics
  const totalSubjects = new Set(timetable.map((e) => e.subject.id)).size;
  const totalFaculty = new Set(timetable.map((e) => e.faculty.id)).size;
  const totalRooms = new Set(timetable.map((e) => e.room.id)).size;
  const totalClasses = timetable.length;

  // Upcoming class
  const upcoming = getUpcomingClass(timetable);

  // Get today's day name in UPPERCASE ("MONDAY" etc)
  const daysArr = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const todayName = daysArr[new Date().getDay()];
  // Prepare today's entries sorted by slot number
  const todayEntries = timetable
    .filter((e) => e.day.name === todayName)
    .sort((a, b) => (a.timeSlot.slotNumber ?? 0) - (b.timeSlot.slotNumber ?? 0));

  return (
    <div className="container max-w-5xl mx-auto p-2 pb-10" style={{ backgroundColor: "#fafbfb", color: "#22292f" }}>
      {/* Profile Card and Stats */}
      <div className="flex flex-col md:flex-row gap-6 my-8">
        <div className="flex-1 rounded-lg shadow-lg bg-white border border-gray-200 h-fit">
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-purple-50 w-28 h-28 flex items-center justify-center mb-2 border border-purple-100">
              <span className="text-5xl select-none font-bold text-purple-500">
                {user.name ? user.name[0] : "S"}
              </span>
            </div>
            <div className="text-xl font-semibold mt-2 text-zinc-900">
              {user.name || "Student"}
            </div>
            <div className="mt-1 text-zinc-600 text-sm">
              Section:{" "}
              <span className="font-medium text-zinc-900">
                {section ? section.name : "?"}
              </span>{" "}
              &nbsp; &middot; &nbsp;
              Semester:{" "}
              <span className="font-medium text-zinc-900">
                {section ? section.semester : "?"}
              </span>
            </div>
            <div className="mt-2 text-gray-500 text-xs">
              {section && section.course ? (
                <span className="text-zinc-900">{`Course: ${section.course.name}`}</span>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
        <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-blue-100 border border-blue-200 text-center py-6 flex flex-col">
            <div className="text-blue-700 text-2xl font-semibold">
              {totalSubjects}
            </div>
            <div className="text-sm text-blue-900 mt-1">Subjects</div>
          </div>
          <div className="rounded-lg bg-green-100 border border-green-200 text-center py-6 flex flex-col">
            <div className="text-green-700 text-2xl font-semibold">
              {totalFaculty}
            </div>
            <div className="text-sm text-green-900 mt-1">Faculty</div>
          </div>
          <div className="rounded-lg bg-yellow-100 border border-yellow-200 text-center py-6 flex flex-col">
            <div className="text-yellow-700 text-2xl font-semibold">
              {totalRooms}
            </div>
            <div className="text-sm text-yellow-900 mt-1">Rooms</div>
          </div>
          <div className="rounded-lg bg-purple-100 border border-purple-200 text-center py-6 flex flex-col">
            <div className="text-purple-700 text-2xl font-semibold">
              {totalClasses}
            </div>
            <div className="text-sm text-purple-900 mt-1">Total Classes</div>
          </div>
        </div>
      </div>

      {/* Next/upcoming class  */}
      <div className="my-12">
        <div className="mb-2 font-semibold text-lg text-zinc-900">Upcoming Class</div>
        {upcoming ? (
          <div className="rounded-lg border border-blue-100 p-4 bg-blue-50 flex flex-col md:flex-row md:items-center md:gap-10 shadow-sm">
            <div className="text-xl font-bold text-blue-700">
              {upcoming.entry.subject.name}
            </div>
            <div className="flex gap-4 text-blue-900 mt-2 md:mt-0">
              <span className="text-zinc-900">
                <span className="font-medium text-zinc-900">Day:</span> {upcoming.dayName}
              </span>
              <span className="text-zinc-900">
                <span className="font-medium text-zinc-900">Time:</span>{" "}
                {formatTime(upcoming.startTime)} - {formatTime(upcoming.endTime)}
              </span>
              <span className="text-zinc-900">
                <span className="font-medium text-zinc-900">Room:</span>{" "}
                {upcoming.entry.room.name}
              </span>
              <span className="text-zinc-900">
                <span className="font-medium text-zinc-900">Faculty:</span>{" "}
                {upcoming.entry.faculty.user.name}
              </span>
            </div>
            {/* Class time in how much */}
            {classTimeLeft !== null && (
              <div className="mt-3 md:mt-0 md:ml-6 flex items-center gap-2">
                <span className="inline-block px-3 py-1 rounded bg-blue-200 border border-blue-300 text-blue-800 font-semibold text-xs">
                  In {classTimeLeft}
                </span>
              </div>
            )}
            <div className="ml-auto mt-4 md:mt-0">
              <Link
                href={`/timetable/${upcoming.entry.section?.id || section?.id || 1}`}
                className="rounded px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
              >
                View Timetable
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-blue-400 text-sm rounded border border-blue-100 p-4 bg-blue-50">
            No upcoming classes found.
          </div>
        )}
      </div>

      {/* Today at a Glance */}
      <div className="my-10">
        <div className="mb-2 font-semibold text-lg text-zinc-900">Today at a Glance</div>
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="bg-zinc-100 text-left font-bold p-2 text-zinc-900">
                  Slot
                </th>
                <th className="bg-zinc-100 text-left font-bold p-2 text-zinc-900">
                  Time
                </th>
                <th className="bg-zinc-100 text-left font-bold p-2 text-zinc-900">
                  Subject
                </th>
                <th className="bg-zinc-100 text-left font-bold p-2 text-zinc-900">
                  Room
                </th>
                <th className="bg-zinc-100 text-left font-bold p-2 text-zinc-900">
                  Faculty
                </th>
              </tr>
            </thead>
            <tbody>
              {todayEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-3 text-center text-blue-400 text-sm bg-blue-50"
                  >
                    No classes scheduled for today.
                  </td>
                </tr>
              ) : (
                SLOT_TEMPLATE.map((slot) => {
                  // Find all entries for this slot
                  const slotEntries = todayEntries.filter(
                    (entry) =>
                      (entry.timeSlot.slotNumber ??
                        entry.timeSlot.id ??
                        (entry as any).timeSlot.timeSlotNumber) === slot.slotNumber
                  );
                  if (slotEntries.length === 0) {
                    return (
                      <tr key={slot.slotNumber} className="bg-gray-50">
                        <td className="px-2 py-2 border-b border-gray-200 font-semibold text-zinc-900">
                          {slot.slotNumber}
                        </td>
                        <td className="px-2 py-2 border-b border-gray-200 text-zinc-900">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </td>
                        <td className="px-2 py-2 border-b border-gray-200 text-gray-300 text-xs text-zinc-900" colSpan={3}>
                          -
                        </td>
                      </tr>
                    );
                  }
                  // If multiple classes at the same slot (e.g., labs, splits), list each
                  return slotEntries.map((entry, idx) => (
                    <tr key={entry.id}>
                      {idx === 0 ? (
                        <>
                          <td className="px-2 py-2 border-b border-gray-200 font-semibold text-zinc-900" rowSpan={slotEntries.length}>
                            {slot.slotNumber}
                          </td>
                          <td className="px-2 py-2 border-b border-gray-200 text-zinc-900" rowSpan={slotEntries.length}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </td>
                        </>
                      ) : null}
                      <td className="px-2 py-2 border-b border-gray-200 text-zinc-900 bg-white">
                        {entry.subject.name}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-200 text-zinc-900 bg-white">
                        {entry.room.name}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-200 text-zinc-900 bg-white">
                        {entry.faculty.user.name}
                      </td>
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;