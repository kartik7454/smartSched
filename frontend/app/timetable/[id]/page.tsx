"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Room = {
  id: number;
  name: string;
  roomType: string;
};

type TimetableEntry = {
  id: number;
  sessionId?: number;
  sectionId: number | null;
  groupId?: number | null;
  subjectId: number;
  facultyId: number;
  roomId: number;
  dayId: number;
  timeSlotId: number;
  subject: { id: number; name: string; isLab: boolean };
  faculty: { id: number; user: { name: string } };
  room: Room;
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

type Faculty = {
  id: number;
  userId: number;
  departmentId: number;
  maxLecturesPerWeek: number;
  user: {
    id: number;
    name: string;
    email: string;
    password: string;
    roleId: number;
    departmentId: number;
  };
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

// --- BEGIN SLOT TEMPLATE (for showing all slots columns) ---
const SLOT_TEMPLATE = [
  { slotNumber: 1, startTime: "09:00", endTime: "10:00" },
  { slotNumber: 2, startTime: "10:00", endTime: "11:00" },
  { slotNumber: 3, startTime: "11:00", endTime: "12:00" },
  { slotNumber: 4, startTime: "12:00", endTime: "13:00" },
  { slotNumber: 5, startTime: "13:00", endTime: "14:00" },
  { slotNumber: 6, startTime: "14:00", endTime: "15:00" },
  { slotNumber: 7, startTime: "15:00", endTime: "16:00" },
];
// --- END SLOT TEMPLATE ---

function formatTime(s: string) {
  if (!s) return "";
  const [h, m] = s.split(":").map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

/**
 * Always show all slot columns, regardless of whether any entry exists in that slot.
 * 'slotDetails' columns come from SLOT_TEMPLATE. Data fill uses mapping to each day/slotNumber pair, even if empty.
 */
function buildGrid(entries: TimetableEntry[]) {
  // Build unique map of day name to an actual day id (fall back if not present in dataset)
  // Our goal: always show all days in DAY_ORDER, preserving a stable dayId if available,
  // or making up a negative id if not present in data.
  const uniqueDaysMap = new Map<string, number>();
  entries.forEach((e) => {
    if (!uniqueDaysMap.has(e.day.name)) {
      uniqueDaysMap.set(e.day.name, e.day.id);
    }
  });

  // Build all days in order, using real id if present, else fake
  const allDays = DAY_ORDER.map((dayName, idx) =>
    uniqueDaysMap.has(dayName)
      ? { id: uniqueDaysMap.get(dayName)!, name: dayName }
      : { id: -1000 - idx, name: dayName }
  );

  // Use the slot template strictly as the columns (show all, always)
  const slotDetails = SLOT_TEMPLATE.map((slot) => ({
    id: slot.slotNumber, // Use slotNumber as the slotId for "display"
    startTime: slot.startTime,
    endTime: slot.endTime,
    slotNumber: slot.slotNumber,
  }));

  // slotIds are just the slotNumbers, strictly in order
  const slotIds = SLOT_TEMPLATE.map((slot) => slot.slotNumber);

  // Map of (dayId string:slotNumber) to entries[] for quick lookup
  const cellMap = new Map<string, TimetableEntry[]>();
  for (const e of entries) {
    const key = `${e.dayId}:${e.timeSlot.timeSlotNumber ?? e.timeSlot.slotNumber ?? e.timeSlotId}`;
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

// Get all cells for a day - one per time slot in SLOT_TEMPLATE
function getCellsForDay(dayId: number, slotIds: number[], cellMap: Map<string, TimetableEntry[]>) {
  // For each slot, pull any entry(ies) for this day and slotNumber
  return slotIds.map((slotNumber) => {
    const key = `${dayId}:${slotNumber}`;
    return { colSpan: 1, entries: cellMap.get(key) ?? [], dayId, slotNumber };
  });
}

function getFullSectionLabel(entry?: TimetableEntry): string {
  if (!entry || !entry.section) return "";
  const { section } = entry;
  const courseName = section.course?.name ?? "Course";
  const semesterStr = section.semester ? `Sem ${section.semester}` : "";
  const sectionName = section.name ?? "";
  return [courseName, semesterStr, sectionName].filter(Boolean).join(" - ");
}

type AddModalState =
  | null
  | {
      dayId: number;
      slotId: number;
      visible: boolean;
    };

type CourseSubject = {
  id: number;
  courseId: number;
  subjectId: number;
  semester: number;
  lecturesPerWeek: number;
  isLab: boolean;
  subject: {
    id: number;
    name: string;
    isLab: boolean;
    departmentId: number;
  };
};

export default function SectionTimetablePage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionLabel, setSectionLabel] = useState<string>("");
  const [addModal, setAddModal] = useState<AddModalState>(null);
  const [pendingEntries, setPendingEntries] = useState<TimetableEntry[] | null>(
    null
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  // For fetched course subjects available for add in modal
  const [subjectOptions, setSubjectOptions] = useState<CourseSubject[]>([]);

  // For fetched faculty options for given subjects
  const [facultyOptions, setFacultyOptions] = useState<Faculty[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);

  // Fetched rooms list for the department
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Only for add (subjectId, facultyId, roomId)
  const [formState, setFormState] = useState<{
    subjectId: number | "";
    facultyId: number | "";
    roomId: number | "";
  }>({ subjectId: "", facultyId: "", roomId: "" });

  // Store section metadata for easy lookup (for fetching subject list)
  // Also fetch departmentId!
  const [sectionInfo, setSectionInfo] = useState<{ courseId: number; semester: number; departmentId?: number } | null>(null);

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!id) {
      setError("Section ID is missing.");
      setLoading(false);
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/timetables/section/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch timetable.");

      const timetableData = await res.json();
      setEntries(timetableData);
      setPendingEntries(null);

      let label = "";
      if (Array.isArray(timetableData) && timetableData.length > 0) {
        label = getFullSectionLabel(timetableData[0]);
        const theSection = timetableData[0].section;

        let courseId = undefined;
        let departmentId = undefined;
        if (theSection) {
          if ((theSection as any).courseId) {
            courseId = (theSection as any).courseId;
          } else if (theSection.course && (theSection.course as any).id) {
            courseId = (theSection.course as any).id;
          }
          if (
            timetableData[0]?.subject &&
            typeof timetableData[0].subject.departmentId !== "undefined"
          ) {
            departmentId = timetableData[0].subject.departmentId;
          } else if (
            timetableData[0]?.faculty?.user &&
            typeof timetableData[0].faculty.user.departmentId !== "undefined"
          ) {
            departmentId = timetableData[0].faculty.user.departmentId;
          }
          setSectionInfo({
            courseId,
            semester: theSection.semester,
            departmentId,
          });
        } else {
          setSectionInfo(null);
        }
      } else {
        setSectionInfo(null);
      }
      setSectionLabel(label || id);
    } catch (err: any) {
      setError(err.message || "Error fetching timetable.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void loadTimetable();
  }, [loadTimetable]);

  // After we receive the sectionInfo, fetch subject options for this course/semester
  useEffect(() => {
    async function fetchCourseSubjects() {
      if (!sectionInfo) {
        setSubjectOptions([]);
        return;
      }
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        const res = await fetch(
          `http://localhost:3000/course-subject/by-course-and-semester?courseId=${sectionInfo?.courseId}&semester=${sectionInfo?.semester}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch subjects for course.");
        const data: CourseSubject[] = await res.json();
        setSubjectOptions(data.filter(s => s.semester === sectionInfo?.semester));
      } catch (err: any) {
        setSubjectOptions([]);
      }
    }
    fetchCourseSubjects();
  }, [sectionInfo]);

  // After we have departmentId in sectionInfo, fetch rooms for department
  useEffect(() => {
    async function fetchRooms() {
      if (!sectionInfo?.departmentId) {
        setRooms([]);
        return;
      }
      setRoomsLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        const res = await fetch(
          `http://localhost:3000/rooms/department/${sectionInfo.departmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch rooms for department.");
        const data: Room[] = await res.json();
        setRooms(data);
      } catch (err: any) {
        setRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    }
    if (sectionInfo?.departmentId) {
      fetchRooms();
    }
  }, [sectionInfo?.departmentId]);

  // Faculties who teach the subject selected in the add-slot modal
  useEffect(() => {
    if (!addModal?.visible || !formState.subjectId) {
      setFacultyOptions([]);
      return;
    }

    async function fetchFacultyForSubject() {
      setFacultyLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        const res = await fetch(
          "http://localhost:3000/faculty-subject/unique-faculties-by-subjects",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              subjectIds: [formState.subjectId],
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to fetch faculties for subject.");

        const data: Faculty[] = await res.json();
        setFacultyOptions(data);
      } catch {
        setFacultyOptions([]);
      } finally {
        setFacultyLoading(false);
      }
    }
    void fetchFacultyForSubject();
  }, [addModal?.visible, formState.subjectId]);

  function startEditMode() {
    setPendingEntries(entries.slice());
  }
  function cancelEditMode() {
    setPendingEntries(null);
    setAddModal(null);
  }

  function openAddSlot(dayId: number, slotNumber: number) {
    setFormState({ subjectId: "", facultyId: "", roomId: "" });
    setAddModal({ dayId: dayId, slotId: slotNumber, visible: true });
  }

  function handleFormChange(e: any) {
    const name = e.target.name as string;
    const value = e.target.value ? Number(e.target.value) : "";
    setFormState((old) => ({
      ...old,
      [name]: value,
      ...(name === "subjectId" ? { facultyId: "" as const } : {}),
    }));
  }

  function handleAddSlot() {
    if (
      !formState.subjectId ||
      !formState.facultyId ||
      !formState.roomId ||
      !addModal
    )
      return;

    if (!pendingEntries) return;
    const subjectObj = subjectOptions.find((x) => x.subject.id === formState.subjectId);
    const subj = subjectObj?.subject;
    if (!subj) return;
    const faculty = facultyOptions.find((x) => x.id === formState.facultyId)!;
    const room = rooms.find((x) => x.id === formState.roomId)!;
    if (!room) return;

    const nextId =
      Math.min(0, ...pendingEntries.map((e) => (e.id <= 0 ? e.id : 0))) - 1;

    setPendingEntries((old) => [
      ...old!,
      {
        id: nextId,
        sessionId: entries[0]?.sessionId,
        sectionId: entries[0]?.sectionId ?? Number(id),
        groupId: entries[0]?.groupId ?? null,
        subjectId: subj.id,
        facultyId: faculty.id,
        roomId: room.id,
        dayId: addModal.dayId,
        timeSlotId: addModal.slotId, // Use slotNumber (see buildGrid)
        subject: subj,
        faculty,
        room,
        day:
          entries.find((e) => e.dayId === addModal.dayId)?.day ||
          { id: addModal.dayId, name: "" },
        timeSlot: (() => {
          // try to get from template; id = slotNumber
          const t = SLOT_TEMPLATE.find(t => t.slotNumber === addModal.slotId);
          return {
            id: addModal.slotId,
            startTime: t?.startTime || "",
            endTime: t?.endTime || "",
            slotNumber: addModal.slotId,
          };
        })(),
        section: entries[0]?.section,
      },
    ]);
    setAddModal(null);
    setFormState({ subjectId: "", facultyId: "", roomId: "" });
  }

  function handleDeleteEntry(entryId: number) {
    if (!pendingEntries) return;
    setPendingEntries((old) => old!.filter((e) => e.id !== entryId));
  }

  async function handleSubmitEdits() {
    if (!pendingEntries) return;
    setSubmitting(true);

    const cleaned = pendingEntries.map((e) => {
      const row: Record<string, unknown> = {
        subjectId: e.subjectId,
        facultyId: e.facultyId,
        roomId: e.roomId,
        dayId: e.dayId,
        timeSlotId: e.timeSlotId,
      };
      if (e.id > 0) row.id = e.id;
      if (e.sessionId != null) row.sessionId = e.sessionId;
      if (e.sectionId != null) row.sectionId = e.sectionId;
      if (e.groupId != null) row.groupId = e.groupId;
      return row;
    });

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const res = await fetch(
        `http://localhost:3000/timetables/section/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleaned),
        }
      );
      if (!res.ok) {
        let msg = "Failed to update timetable.";
        try {
          const errBody = await res.json();
          if (Array.isArray(errBody.message)) msg = errBody.message.join(", ");
          else if (typeof errBody.message === "string") msg = errBody.message;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      setPendingEntries(null);
      await loadTimetable();
    } catch (err: any) {
      alert(err.message || "Failed to update.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return <div className="p-6">Loading...</div>;
  if (error)
    return <div className="p-6 text-red-500">{error}</div>;

  const showingEntries = pendingEntries ?? entries;
  const grid = buildGrid(showingEntries);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Timetable for Section {sectionLabel}
      </h1>

      {pendingEntries ? (
        <div className="mb-3 flex gap-2">
          <button
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            onClick={handleSubmitEdits}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Submit Edits"}
          </button>
          <button
            className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
            onClick={cancelEditMode}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="mb-4 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          onClick={startEditMode}
        >
          Edit Timetable
        </button>
      )}

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
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
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
              return (
                <tr key={d.id}>
                  <td className="border-b border-r px-3 py-2 font-medium">
                    {d.name.slice(0, 3)}
                  </td>
                  {cells.map((cell: any, i: number) => {
                    const isEdit = !!pendingEntries;
                    return (
                      <td
                        key={i}
                        className="border-b border-r p-2 align-top"
                        style={{ minWidth: 120 }}
                      >
                        {cell.entries.length === 0 ? (
                          isEdit ? (
                            <button
                              className="text-xs border border-dashed border-gray-400 rounded px-1 py-2 w-full text-center text-gray-700 bg-gray-50 hover:bg-gray-100"
                              onClick={() => openAddSlot(cell.dayId, cell.slotNumber)}
                            >
                              + Add
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs block text-center py-4">
                              —
                            </span>
                          )
                        ) : (
                          <div className="flex flex-col gap-1">
                            {cell.entries.map((e: TimetableEntry) => (
                              <div
                                key={e.id}
                                className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-2 pr-8"
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
                                  {e.faculty.user.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {e.room.name}
                                </div>
                                {isEdit && (
                                  <div className="absolute top-1 right-1 flex flex-row gap-1">
                                    {/* No edit button! Only delete */}
                                    <button
                                      className="text-red-600 text-xs bg-white px-1 rounded hover:underline"
                                      title="Delete"
                                      onClick={() => handleDeleteEntry(e.id)}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
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
      {
        (!entries.length && !pendingEntries) && (
          <div className="p-6">No timetable for this section.</div>
        )
      }
      {/* Add Modal */}
      {addModal?.visible && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setAddModal(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl min-w-[300px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold mb-2 text-black">
              Add to Slot
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSlot();
              }}
              className="space-y-2"
            >
              <div>
                <label className="block text-xs mb-1  text-black">Subject</label>
                <select
                  name="subjectId"
                  value={formState.subjectId}
                  onChange={handleFormChange}
                  className="w-full border rounded p-1 text-sm  text-black"
                  required
                  disabled={!subjectOptions.length}
                >
                  <option value="">Select…</option>
                  {subjectOptions.map((s) => (
                    <option value={s.subject.id} key={s.subject.id}>
                      {s.subject.name}
                      {s.subject.isLab ? ' (Lab)' : ""}
                    </option>
                  ))}
                </select>
                {!subjectOptions.length && (
                  <div className="text-xs text-gray-500 mt-1">
                    {sectionInfo
                      ? "No subjects available for this course & semester."
                      : "Loading subjects..."}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1  text-black">Faculty</label>
                <select
                  name="facultyId"
                  value={formState.facultyId}
                  onChange={handleFormChange}
                  className="w-full border rounded p-1 text-sm  text-black"
                  required
                  disabled={!formState.subjectId || facultyLoading}
                >
                  <option value="">{facultyLoading ? "Loading…" : "Select…"}</option>
                  {facultyOptions.map((f) => (
                    <option value={f.id} key={f.id}>
                      {f.user.name}
                    </option>
                  ))}
                </select>
                {formState.subjectId && !facultyLoading && facultyOptions.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    No faculties available for this subject.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1  text-black">Room</label>
                <select
                  name="roomId"
                  value={formState.roomId}
                  onChange={handleFormChange}
                  className="w-full border rounded p-1 text-sm  text-black"
                  required
                  disabled={roomsLoading}
                >
                  <option value="">{roomsLoading ? "Loading…" : "Select…"}</option>
                  {rooms.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {!roomsLoading && rooms.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    No rooms available for this department.
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-3 gap-2">
                <button
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                  type="submit"
                  disabled={
                    !subjectOptions.length ||
                    !facultyOptions.length ||
                    facultyLoading ||
                    !rooms.length ||
                    roomsLoading
                  }
                >
                  Add
                </button>
                <button
                  className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                  type="button"
                  onClick={() => setAddModal(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}