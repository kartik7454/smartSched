"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Define types
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
  name?: string;
};

type UpcomingClass = {
  entry: TimetableEntry;
  startTime: string;
  endTime: string;
  dayName: string;
};

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const SLOT_TEMPLATE = [
  { slotNumber: 1, startTime: "09:00", endTime: "10:00" },
  { slotNumber: 2, startTime: "10:00", endTime: "11:00" },
  { slotNumber: 3, startTime: "11:00", endTime: "12:00" },
  { slotNumber: 4, startTime: "12:00", endTime: "13:00" },
  { slotNumber: 5, startTime: "13:00", endTime: "14:00" },
  { slotNumber: 6, startTime: "14:00", endTime: "15:00" },
  { slotNumber: 7, startTime: "15:00", endTime: "16:00" }
];

// Helper function for time formatting
function formatTime(s: string) {
  if (!s) return "";
  const [h, m] = s.split(":").map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

// Helper to get user from JWT token
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
      name: payload.name || "", // use payload.name if available
    };
  } catch {
    return null;
  }
}

// --- COMPONENT START ---
export default function FacultyDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingClass | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived stats
  const totalSections = new Set(timetable.map((e) => e.section?.id)).size;
  const totalSubjects = new Set(timetable.map((e) => e.subject.id)).size;
  const totalRooms = new Set(timetable.map((e) => e.room.id)).size;
  const totalClasses = timetable.length;

  // --- Fetch faculty info and their assigned timetable ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const u = await getUserFromToken();
      const user_id = u?.userId
      let faculty = null;
      if (user_id) {
        try {
          const res = await fetch(
            `http://localhost:3000/faculty/user/${user_id}`,
            {
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            }
          );
          if (res.ok) {
            faculty = await res.json();
            setUser(faculty.user);
          
          
          
          }
        } catch (e) {
          // Optionally handle error
        }
      }
      // Fake/fallback for demo -- in real app, API call using facultyId
      // Example: `/api/faculty/${u?.userId}/timetable`
      let entries: TimetableEntry[] = [];
      try {
        const res = await fetch(`http://localhost:3000/timetables/faculty/${faculty.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
   
        if (res.ok) {
          entries = await res.json();
        }
      } catch {
        entries = [];
      }

      setTimetable(entries);

      // Find "today"'s schedule for this faculty
      const todayName = DAY_ORDER[new Date().getDay() - 1] || "MONDAY";
      const todayEntries = entries.filter((e) => e.day.name === todayName);
      setTodaySchedule(todayEntries);

      // Find upcoming class for today/tomorrow (sorted by slot)
      let upcoming: UpcomingClass | null = null;
      const now = new Date();
      const nowH = now.getHours();
      const nowM = now.getMinutes();

      // Flatten all entries, find next one whose day + startTime > now
      const entriesWithDate = entries
        .map((e) => {
          const slot = SLOT_TEMPLATE.find(
            (s) => s.slotNumber === e.timeSlot.slotNumber
          );
          let dayIdx = DAY_ORDER.indexOf(e.day.name.toUpperCase());
          if (dayIdx < 0) dayIdx = 0;
          // Compose an absolute "date" for this week's day + slot
          const todayIdx = new Date().getDay() - 1; // 0=Mon
          let dayDiff = dayIdx - todayIdx;
          if (dayDiff < 0) dayDiff += 7;
          const base = new Date();
          base.setDate(base.getDate() + dayDiff);
          const [h, m] = slot ? slot.startTime.split(":").map(Number) : [0, 0];
          const classDate = new Date(base);
          classDate.setHours(h, m, 0, 0);
          return { entry: e, slot, classDate, dayName: e.day.name };
        })
        .sort((a, b) => a.classDate.getTime() - b.classDate.getTime());

      for (const { entry, slot, classDate, dayName } of entriesWithDate) {
        if (classDate > now) {
          upcoming = {
            entry,
            startTime: slot ? slot.startTime : entry.timeSlot.startTime,
            endTime: slot ? slot.endTime : entry.timeSlot.endTime,
            dayName
          };
          break;
        }
      }
      setUpcoming(upcoming);

      setLoading(false);
    }

    fetchData();
  }, []);

  // Compute time left until upcoming class
  let classTimeLeft: string | null = null;
  if (upcoming) {
    const now = new Date();
    const today = new Date();
    let dayIdx = DAY_ORDER.indexOf(upcoming.dayName.toUpperCase());
    if (dayIdx < 0) dayIdx = 0;
    const todayIdx = new Date().getDay() - 1;
    let dayDiff = dayIdx - todayIdx;
    if (dayDiff < 0) dayDiff += 7;
    const base = new Date();
    base.setDate(base.getDate() + dayDiff);
    const [h, m] = upcoming.startTime.split(":").map(Number);
    const classDate = new Date(base);
    classDate.setHours(h, m, 0, 0);
    const mins = Math.round((classDate.getTime() - now.getTime()) / 60000);
    if (mins > 60) {
      classTimeLeft = `${Math.floor(mins / 60)}h ${mins % 60}m`;
    } else if (mins > 0) {
      classTimeLeft = `${mins} min`;
    }
  }

  // --- RENDER UI ---
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 pb-2">
          <div className="rounded-full bg-blue-200 w-16 h-16 flex justify-center items-center text-3xl text-blue-800 font-bold">
            {user?.name?.[0] || "F"}
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-900">{user?.name || "Faculty"}</div>
            <div className="text-gray-700 text-sm">Faculty Dashboard</div>
          </div>
        </div>
        <div className="flex mt-6 gap-4 flex-wrap">
          <div className="rounded-lg bg-green-100 border border-green-200 text-center py-6 flex-1">
            <div className="text-green-700 text-2xl font-semibold">
              {totalSections}
            </div>
            <div className="text-sm text-green-900 mt-1">Sections</div>
          </div>
          <div className="rounded-lg bg-blue-100 border border-blue-200 text-center py-6 flex-1">
            <div className="text-blue-700 text-2xl font-semibold">
              {totalSubjects}
            </div>
            <div className="text-sm text-blue-900 mt-1">Subjects</div>
          </div>
          <div className="rounded-lg bg-yellow-100 border border-yellow-200 text-center py-6 flex-1">
            <div className="text-yellow-700 text-2xl font-semibold">
              {totalRooms}
            </div>
            <div className="text-sm text-yellow-900 mt-1">Rooms</div>
          </div>
          <div className="rounded-lg bg-purple-100 border border-purple-200 text-center py-6 flex-1">
            <div className="text-purple-700 text-2xl font-semibold">
              {totalClasses}
            </div>
            <div className="text-sm text-purple-900 mt-1">Total Classes</div>
          </div>
        </div>
      </div>

      {/* Upcoming Class */}
      <div className="my-12">
        <div className="mb-2 font-semibold text-lg text-zinc-900">Upcoming Class</div>
        {loading ? (
          <div className="text-blue-400 text-sm rounded border border-blue-100 p-4 bg-blue-50">
            Loading...
          </div>
        ) : upcoming ? (
          <div className="rounded-lg border border-blue-100 p-4 bg-blue-50 flex flex-col md:flex-row md:items-center md:gap-10 shadow-sm">
            <div className="text-xl font-bold text-blue-700">
              {upcoming.entry.subject.name}
            </div>
            <div className="flex gap-4 text-blue-900 mt-2 md:mt-0 flex-wrap">
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
                <span className="font-medium text-zinc-900">Section:</span>{" "}
                {upcoming.entry.section?.name || "-"}
              </span>
            </div>
            {classTimeLeft !== null && (
              <div className="mt-3 md:mt-0 md:ml-6 flex items-center gap-2">
                <span className="inline-block px-3 py-1 rounded bg-blue-200 border border-blue-300 text-blue-800 font-semibold text-xs">
                  In {classTimeLeft}
                </span>
              </div>
            )}
            <div className="ml-auto mt-4 md:mt-0">
              <Link
                href={`/myTimetable/faculty`}
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
        <div className="mb-2 font-semibold text-lg text-black">Today at a Glance</div>
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left text-xs text-black">Time</th>
                <th className="py-2 px-4 border-b text-left text-xs text-black">Subject</th>
                <th className="py-2 px-4 border-b text-left text-xs text-black">Section</th>
                <th className="py-2 px-4 border-b text-left text-xs text-black">Room</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-center text-black">
                    Loading...
                  </td>
                </tr>
              ) : todaySchedule.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-center text-black">
                    No classes for today.
                  </td>
                </tr>
              ) : (
                SLOT_TEMPLATE.map((slot) => {
                  const entry = todaySchedule.find(
                    (e) => e.timeSlot.slotNumber === slot.slotNumber
                  );
                  return (
                    <tr key={slot.slotNumber} className={entry ? "" : "bg-gray-50"}>
                      <td className="py-2 px-4 border-b text-sm text-black font-semibold">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </td>
                      <td className="py-2 px-4 border-b text-sm text-black">
                        {entry ? entry.subject.name : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-2 px-4 border-b text-sm text-black">
                        {entry ? entry.section?.name : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-2 px-4 border-b text-sm text-black">
                        {entry ? entry.room.name : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
 
    </div>
  );
}