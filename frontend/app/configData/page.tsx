/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createCourse,
  createCourseSubject,
  createFaculty,
  createFacultySubject,
  createRoom,
  createSection,
  createStudent,
  createSubject,
  createTimeSlot,
  createUserViaRegister,
  deleteCourse,
  deleteCourseSubject,
  deleteFaculty,
  deleteFacultySubject,
  deleteRoom,
  deleteSection,
  deleteStudent,
  deleteSubject,
  deleteTimeSlot,
  getAcademicSessions,
  getCourseSubjects,
  getCourses,
  getDays,
  getDepartments,
  getFaculty,
  getFacultySubjects,
  getRooms,
  getSections,
  getStudents,
  getSubjects,
  getTimeSlots,
  updateCourse,
  updateFaculty,
  updateRoom,
  updateSection,
  updateStudent,
  updateSubject,
  updateTimeSlot,
} from "@/lib/api";

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
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type TabId =
  | "faculty"
  | "students"
  | "subjects"
  | "courses"
  | "sections"
  | "rooms"
  | "days"
  | "slots"
  | "courseSubject"
  | "facultySubject";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "faculty", label: "Faculty" },
  { id: "students", label: "Students" },
  { id: "subjects", label: "Subjects" },
  { id: "courses", label: "Courses" },
  { id: "sections", label: "Sections" },
  { id: "rooms", label: "Rooms" },
  { id: "days", label: "Days" },
  { id: "slots", label: "Slots" },
  { id: "courseSubject", label: "Course ↔ Subject" },
  { id: "facultySubject", label: "Faculty ↔ Subject" },
];

export default function ConfigDataPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("subjects");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departmentName, setDepartmentName] = useState<string>("");

  const [departments, setDepartments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courseSubjects, setCourseSubjects] = useState<any[]>([]);
  const [facultySubjects, setFacultySubjects] = useState<any[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  async function loadAll(deptId: number) {
    const [
      depList,
      sessList,
      courseList,
      subjectList,
      sectionList,
      roomList,
      dayList,
      slotList,
      facultyList,
      studentList,
      csList,
      fsList,
    ] = await Promise.all([
      getDepartments(),
      getAcademicSessions(),
      getCourses(),
      getSubjects(),
      getSections(),
      getRooms(),
      getDays(),
      getTimeSlots(),
      getFaculty(),
      getStudents(),
      getCourseSubjects(),
      getFacultySubjects(),
    ]);

    setDepartments(depList); // (kept for future department switching UI)
    setSessions(sessList);
    setCourses(courseList.filter((c: any) => c.departmentId === deptId));
    setSubjects(subjectList.filter((s: any) => s.departmentId === deptId));
    setSections(sectionList);
    setRooms(roomList.filter((r: any) => r.departmentId === deptId));
    setDays(dayList);
    setSlots(slotList);
    setFaculty(facultyList.filter((f: any) => f.departmentId === deptId));
    setStudents(studentList);
    setCourseSubjects(csList);
    setFacultySubjects(fsList);
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

        if (!res.ok) throw new Error(data?.message || "Failed to load user");
        if (!data.departmentId || !data.department) {
          throw new Error("Your account is not linked to a department.");
        }

        setDepartmentId(data.departmentId);
        setDepartmentName(data.department.name);
        await loadAll(data.departmentId);
      } catch (e: any) {
        setError(e?.message || "Failed to load config data.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const courseById = useMemo(() => new Map(courses.map((c: any) => [c.id, c])), [courses]);
  const subjectById = useMemo(() => new Map(subjects.map((s: any) => [s.id, s])), [subjects]);
  const sessionById = useMemo(() => new Map(sessions.map((s: any) => [s.id, s])), [sessions]);
  const sectionLabel = (sec: any) => {
    const c = courseById.get(sec.courseId);
    const sess = sessionById.get(sec.sessionId);
    return `${c?.name ?? "Course"} · Sem ${sec.semester} ${sec.name} · ${sess?.name ?? "Session"}`;
  };

  async function refresh() {
    if (!departmentId) return;
    setBusy(true);
    setError(null);
    try {
      await loadAll(departmentId);
    } catch (e: any) {
      setError(e?.message || "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  // --- Add forms state ---
  const [newCourse, setNewCourse] = useState({ name: "", durationYears: 3 });
  const [newSubject, setNewSubject] = useState({ name: "", isLab: false });
  const [newRoom, setNewRoom] = useState({ name: "", roomType: "CLASSROOM", capacity: 60 });
  const [newSlot, setNewSlot] = useState({ startTime: "09:00", endTime: "10:00", slotNumber: 1 });
  const [newSection, setNewSection] = useState({
    name: "A",
    semester: 1,
    batchYear: new Date().getFullYear(),
    courseId: 0,
    sessionId: 0,
  });
  const [newCourseSubject, setNewCourseSubject] = useState({
    courseId: 0,
    subjectId: 0,
    semester: 1,
    lecturesPerWeek: 3,
    isLab: false,
  });
  const [newFacultySubject, setNewFacultySubject] = useState({
    facultyId: 0,
    courseId: 0,
    subjectId: 0,
  });
  const [newFacultyUser, setNewFacultyUser] = useState({
    name: "",
    email: "",
    password: "",
    maxLecturesPerWeek: 20,
  });
  const [newStudentUser, setNewStudentUser] = useState({
    name: "",
    email: "",
    password: "",
    sectionId: 0,
    rollNumber: "",
  });

  // --- Inline edit state ---
  const [editing, setEditing] = useState<{ type: TabId; id: number } | null>(null);
  const [editDraft, setEditDraft] = useState<any>({});

  function startEdit(type: TabId, row: any) {
    setEditing({ type, id: row.id });
    setEditDraft({ ...row });
  }
  function cancelEdit() {
    setEditing(null);
    setEditDraft({});
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const { type, id } = editing;
      if (type === "courses") {
        await updateCourse(id, {
          name: editDraft.name,
          durationYears: num(editDraft.durationYears),
        });
      } else if (type === "subjects") {
        await updateSubject(id, { name: editDraft.name, isLab: !!editDraft.isLab });
      } else if (type === "rooms") {
        await updateRoom(id, {
          name: editDraft.name,
          roomType: editDraft.roomType,
          capacity: num(editDraft.capacity),
        });
      } else if (type === "slots") {
        await updateTimeSlot(id, {
          startTime: editDraft.startTime,
          endTime: editDraft.endTime,
          slotNumber: num(editDraft.slotNumber),
        });
      } else if (type === "sections") {
        await updateSection(id, {
          name: editDraft.name,
          semester: num(editDraft.semester),
          batchYear: num(editDraft.batchYear),
          courseId: num(editDraft.courseId),
          sessionId: num(editDraft.sessionId),
        });
      } else if (type === "faculty") {
        await updateFaculty(id, {
          maxLecturesPerWeek: num(editDraft.maxLecturesPerWeek),
        });
      } else if (type === "students") {
        await updateStudent(id, {
          sectionId: num(editDraft.sectionId),
          rollNumber: editDraft.rollNumber,
        });
      }

      cancelEdit();
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(type: TabId, id: number) {
    if (!confirm("Delete this item?")) return;
    setBusy(true);
    setError(null);
    try {
      if (type === "courses") await deleteCourse(id);
      if (type === "subjects") await deleteSubject(id);
      if (type === "rooms") await deleteRoom(id);
      if (type === "slots") await deleteTimeSlot(id);
      if (type === "sections") await deleteSection(id);
      if (type === "faculty") await deleteFaculty(id);
      if (type === "students") await deleteStudent(id);
      if (type === "courseSubject") await deleteCourseSubject(id);
      if (type === "facultySubject") await deleteFacultySubject(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCourse() {
    if (!departmentId) return;
    setBusy(true);
    setError(null);
    try {
      await createCourse({
        name: newCourse.name.trim(),
        departmentId,
        durationYears: num(newCourse.durationYears),
      });
      setNewCourse({ name: "", durationYears: newCourse.durationYears });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create course failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSubject() {
    if (!departmentId) return;
    setBusy(true);
    setError(null);
    try {
      await createSubject({
        name: newSubject.name.trim(),
        isLab: !!newSubject.isLab,
        departmentId,
      });
      setNewSubject({ name: "", isLab: false });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create subject failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateRoom() {
    if (!departmentId) return;
    setBusy(true);
    setError(null);
    try {
      await createRoom({
        name: newRoom.name.trim(),
        roomType: newRoom.roomType,
        capacity: num(newRoom.capacity),
        departmentId,
      });
      setNewRoom({ name: "", roomType: "CLASSROOM", capacity: 60 });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create room failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSlot() {
    setBusy(true);
    setError(null);
    try {
      await createTimeSlot({
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        slotNumber: num(newSlot.slotNumber),
      });
      setNewSlot({ startTime: "09:00", endTime: "10:00", slotNumber: num(newSlot.slotNumber) + 1 });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create slot failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSection() {
    setBusy(true);
    setError(null);
    try {
      await createSection({
        name: newSection.name.trim(),
        semester: num(newSection.semester),
        batchYear: num(newSection.batchYear),
        courseId: num(newSection.courseId),
        sessionId: num(newSection.sessionId),
      });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create section failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCourseSubject() {
    setBusy(true);
    setError(null);
    try {
      await createCourseSubject({
        courseId: num(newCourseSubject.courseId),
        subjectId: num(newCourseSubject.subjectId),
        semester: num(newCourseSubject.semester),
        lecturesPerWeek: num(newCourseSubject.lecturesPerWeek),
        isLab: !!newCourseSubject.isLab,
      });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create mapping failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateFacultySubject() {
    setBusy(true);
    setError(null);
    try {
      await createFacultySubject({
        facultyId: num(newFacultySubject.facultyId),
        courseId: num(newFacultySubject.courseId),
        subjectId: num(newFacultySubject.subjectId),
      });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create mapping failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateFacultyUserAndFaculty() {
    if (!departmentId) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createUserViaRegister({
        name: newFacultyUser.name.trim(),
        email: newFacultyUser.email.trim(),
        password: newFacultyUser.password,
        roleId: 2,
        departmentId,
      });
      const userId = created?.user?.id ?? created?.userId ?? created?.id;
      if (!userId) throw new Error("User created but no user id returned");

      await createFaculty({
        userId: num(userId),
        departmentId,
        maxLecturesPerWeek: num(newFacultyUser.maxLecturesPerWeek),
      });
      setNewFacultyUser({ name: "", email: "", password: "", maxLecturesPerWeek: 20 });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create faculty failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateStudentUserAndStudent() {
    setBusy(true);
    setError(null);
    try {
      const created = await createUserViaRegister({
        name: newStudentUser.name.trim(),
        email: newStudentUser.email.trim(),
        password: newStudentUser.password,
        roleId: 3,
      });
      const userId = created?.user?.id ?? created?.userId ?? created?.id;
      if (!userId) throw new Error("User created but no user id returned");

      await createStudent({
        userId: num(userId),
        sectionId: num(newStudentUser.sectionId),
        rollNumber: newStudentUser.rollNumber.trim(),
      });
      setNewStudentUser({
        name: "",
        email: "",
        password: "",
        sectionId: 0,
        rollNumber: "",
      });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create student failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (courses.length && newSection.courseId === 0) {
      setNewSection((s) => ({ ...s, courseId: courses[0].id }));
      setNewCourseSubject((x) => ({ ...x, courseId: courses[0].id }));
      setNewFacultySubject((x) => ({ ...x, courseId: courses[0].id }));
    }
  }, [courses]);

  useEffect(() => {
    if (subjects.length && newCourseSubject.subjectId === 0) {
      setNewCourseSubject((x) => ({ ...x, subjectId: subjects[0].id }));
      setNewFacultySubject((x) => ({ ...x, subjectId: subjects[0].id }));
    }
  }, [subjects]);

  useEffect(() => {
    if (sessions.length && newSection.sessionId === 0) {
      const active = sessions.find((s: any) => s.isActive);
      setNewSection((s) => ({ ...s, sessionId: (active ?? sessions[0]).id }));
    }
  }, [sessions]);

  useEffect(() => {
    if (sections.length && newStudentUser.sectionId === 0) {
      setNewStudentUser((s) => ({ ...s, sectionId: sections[0].id }));
    }
  }, [sections]);

  useEffect(() => {
    if (faculty.length && newFacultySubject.facultyId === 0) {
      setNewFacultySubject((s) => ({ ...s, facultyId: faculty[0].id }));
    }
  }, [faculty]);

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

  const tabButton = (t: { id: TabId; label: string }) => (
    <button
      key={t.id}
      onClick={() => {
        cancelEdit();
        setActiveTab(t.id);
      }}
      className={cx(
        "px-3 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap",
        activeTab === t.id
          ? "bg-amber-500 text-white border-amber-500"
          : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
      )}
    >
      {t.label}
    </button>
  );

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
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">HOD Config</h1>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {departmentName}
            </span>
          </div>
          <button
            onClick={refresh}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 disabled:opacity-60"
          >
            {busy ? "Working..." : "Refresh"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">{TABS.map(tabButton)}</div>

        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <div className="font-semibold">{TABS.find((t) => t.id === activeTab)?.label}</div>
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <span className="text-xs text-stone-500">Click “Edit” on a row</span>
            )}
          </div>

          {/* FACULTY */}
          {activeTab === "faculty" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Add Faculty (creates User + Faculty)</div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input
                    value={newFacultyUser.name}
                    onChange={(e) => setNewFacultyUser((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Name"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    value={newFacultyUser.email}
                    onChange={(e) => setNewFacultyUser((s) => ({ ...s, email: e.target.value }))}
                    placeholder="Email"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    type="password"
                    value={newFacultyUser.password}
                    onChange={(e) => setNewFacultyUser((s) => ({ ...s, password: e.target.value }))}
                    placeholder="Password"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    type="number"
                    value={newFacultyUser.maxLecturesPerWeek}
                    onChange={(e) =>
                      setNewFacultyUser((s) => ({ ...s, maxLecturesPerWeek: num(e.target.value) }))
                    }
                    placeholder="Max lectures/week"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <button
                    onClick={handleCreateFacultyUserAndFaculty}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
                <div className="text-xs text-stone-500 mt-2">
                  Uses `roleId=2` for faculty.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Max/week</th>
                      <th className="px-3 py-2 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculty.map((f: any) => {
                      const isEditing = editing?.type === "faculty" && editing.id === f.id;
                      return (
                        <tr key={f.id} className="border-b border-stone-100 dark:border-stone-800">
                          <td className="px-3 py-2">
                            {f.user?.name ?? `User #${f.userId}`}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editDraft.maxLecturesPerWeek ?? 0}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({
                                    ...d,
                                    maxLecturesPerWeek: num(e.target.value),
                                  }))
                                }
                                className="w-28 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              f.maxLecturesPerWeek
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {!isEditing && (
                                <button
                                  onClick={() => startEdit("faculty", f)}
                                  className="px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete("faculty", f.id)}
                                className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {faculty.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={3}>
                          No faculty yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STUDENTS */}
          {activeTab === "students" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Add Student (creates User + Student)</div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <input
                    value={newStudentUser.name}
                    onChange={(e) => setNewStudentUser((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Name"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    value={newStudentUser.email}
                    onChange={(e) => setNewStudentUser((s) => ({ ...s, email: e.target.value }))}
                    placeholder="Email"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    type="password"
                    value={newStudentUser.password}
                    onChange={(e) => setNewStudentUser((s) => ({ ...s, password: e.target.value }))}
                    placeholder="Password"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <select
                    value={newStudentUser.sectionId}
                    onChange={(e) =>
                      setNewStudentUser((s) => ({ ...s, sectionId: num(e.target.value) }))
                    }
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    {sections.map((sec: any) => (
                      <option key={sec.id} value={sec.id}>
                        {sectionLabel(sec)}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newStudentUser.rollNumber}
                    onChange={(e) => setNewStudentUser((s) => ({ ...s, rollNumber: e.target.value }))}
                    placeholder="Roll number"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <button
                    onClick={handleCreateStudentUserAndStudent}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
                <div className="text-xs text-stone-500 mt-2">
                  Uses `roleId=3` for students.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Roll</th>
                      <th className="px-3 py-2">Section</th>
                      <th className="px-3 py-2 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s: any) => {
                      const isEditing = editing?.type === "students" && editing.id === s.id;
                      return (
                        <tr key={s.id} className="border-b border-stone-100 dark:border-stone-800">
                          <td className="px-3 py-2">{s.user?.name ?? `User #${s.userId}`}</td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={editDraft.rollNumber ?? ""}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({ ...d, rollNumber: e.target.value }))
                                }
                                className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              s.rollNumber
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <select
                                value={editDraft.sectionId ?? 0}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({
                                    ...d,
                                    sectionId: num(e.target.value),
                                  }))
                                }
                                className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              >
                                {sections.map((sec: any) => (
                                  <option key={sec.id} value={sec.id}>
                                    {sectionLabel(sec)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              s.section
                                ? sectionLabel(s.section)
                                : `Section #${s.sectionId}`
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {!isEditing && (
                                <button
                                  onClick={() => startEdit("students", s)}
                                  className="px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete("students", s.id)}
                                className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {students.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={4}>
                          No students yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBJECTS */}
          {activeTab === "subjects" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Add Subject</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    value={newSubject.name}
                    onChange={(e) => setNewSubject((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Subject name"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                    <input
                      type="checkbox"
                      checked={newSubject.isLab}
                      onChange={(e) => setNewSubject((s) => ({ ...s, isLab: e.target.checked }))}
                    />
                    Lab
                  </label>
                  <div className="text-sm text-stone-500 flex items-center">
                    Department: {departmentName}
                  </div>
                  <button
                    onClick={handleCreateSubject}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Lab</th>
                      <th className="px-3 py-2 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s: any) => {
                      const isEditing = editing?.type === "subjects" && editing.id === s.id;
                      return (
                        <tr key={s.id} className="border-b border-stone-100 dark:border-stone-800">
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={editDraft.name ?? ""}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({ ...d, name: e.target.value }))
                                }
                                className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              s.name
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={!!editDraft.isLab}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({ ...d, isLab: e.target.checked }))
                                }
                              />
                            ) : s.isLab ? (
                              "Yes"
                            ) : (
                              "No"
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {!isEditing && (
                                <button
                                  onClick={() => startEdit("subjects", s)}
                                  className="px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete("subjects", s.id)}
                                className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {subjects.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={3}>
                          No subjects yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COURSES */}
          {activeTab === "courses" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Add Course</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    value={newCourse.name}
                    onChange={(e) => setNewCourse((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Course name (e.g., BTech CSE)"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    type="number"
                    value={newCourse.durationYears}
                    onChange={(e) =>
                      setNewCourse((s) => ({ ...s, durationYears: num(e.target.value) }))
                    }
                    placeholder="Duration years"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <div className="text-sm text-stone-500 flex items-center">
                    Department: {departmentName}
                  </div>
                  <button
                    onClick={handleCreateCourse}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c: any) => {
                      const isEditing = editing?.type === "courses" && editing.id === c.id;
                      return (
                        <tr key={c.id} className="border-b border-stone-100 dark:border-stone-800">
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={editDraft.name ?? ""}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({ ...d, name: e.target.value }))
                                }
                                className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              c.name
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editDraft.durationYears ?? 0}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({
                                    ...d,
                                    durationYears: num(e.target.value),
                                  }))
                                }
                                className="w-20 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              `${c.durationYears} years`
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {!isEditing && (
                                <button
                                  onClick={() => startEdit("courses", c)}
                                  className="px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete("courses", c.id)}
                                className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {courses.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={3}>
                          No courses yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTIONS */}
          {activeTab === "sections" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Add Section</div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <select
                    value={newSection.courseId}
                    onChange={(e) => setNewSection((s) => ({ ...s, courseId: num(e.target.value) }))}
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newSection.sessionId}
                    onChange={(e) => setNewSection((s) => ({ ...s, sessionId: num(e.target.value) }))}
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    {sessions.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isActive ? "(Active)" : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newSection.name}
                    onChange={(e) => setNewSection((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Name (A/B/C)"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    type="number"
                    value={newSection.semester}
                    onChange={(e) => setNewSection((s) => ({ ...s, semester: num(e.target.value) }))}
                    placeholder="Semester"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    type="number"
                    value={newSection.batchYear}
                    onChange={(e) => setNewSection((s) => ({ ...s, batchYear: num(e.target.value) }))}
                    placeholder="Batch year"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <button
                    onClick={handleCreateSection}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Section</th>
                      <th className="px-3 py-2">Batch</th>
                      <th className="px-3 py-2 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((sec: any) => {
                      const isEditing = editing?.type === "sections" && editing.id === sec.id;
                      return (
                        <tr key={sec.id} className="border-b border-stone-100 dark:border-stone-800">
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <div className="flex flex-wrap gap-2 items-center">
                                <select
                                  value={editDraft.courseId ?? 0}
                                  onChange={(e) =>
                                    setEditDraft((d: any) => ({
                                      ...d,
                                      courseId: num(e.target.value),
                                    }))
                                  }
                                  className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                                >
                                  {courses.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  value={editDraft.name ?? ""}
                                  onChange={(e) =>
                                    setEditDraft((d: any) => ({ ...d, name: e.target.value }))
                                  }
                                  className="w-16 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                                />
                                <input
                                  type="number"
                                  value={editDraft.semester ?? 1}
                                  onChange={(e) =>
                                    setEditDraft((d: any) => ({
                                      ...d,
                                      semester: num(e.target.value),
                                    }))
                                  }
                                  className="w-20 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                                />
                                <select
                                  value={editDraft.sessionId ?? 0}
                                  onChange={(e) =>
                                    setEditDraft((d: any) => ({
                                      ...d,
                                      sessionId: num(e.target.value),
                                    }))
                                  }
                                  className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                                >
                                  {sessions.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              sectionLabel(sec)
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editDraft.batchYear ?? 0}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({
                                    ...d,
                                    batchYear: num(e.target.value),
                                  }))
                                }
                                className="w-28 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              sec.batchYear
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {!isEditing && (
                                <button
                                  onClick={() => startEdit("sections", sec)}
                                  className="px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete("sections", sec.id)}
                                className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sections.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={3}>
                          No sections yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROOMS */}
          {activeTab === "rooms" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Add Room</div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input
                    value={newRoom.name}
                    onChange={(e) => setNewRoom((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Room name"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <select
                    value={newRoom.roomType}
                    onChange={(e) => setNewRoom((s) => ({ ...s, roomType: e.target.value }))}
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    <option value="CLASSROOM">CLASSROOM</option>
                    <option value="LAB">LAB</option>
                  </select>
                  <input
                    type="number"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom((s) => ({ ...s, capacity: num(e.target.value) }))}
                    placeholder="Capacity"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <div className="text-sm text-stone-500 flex items-center">
                    Department: {departmentName}
                  </div>
                  <button
                    onClick={handleCreateRoom}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Capacity</th>
                      <th className="px-3 py-2 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r: any) => {
                      const isEditing = editing?.type === "rooms" && editing.id === r.id;
                      return (
                        <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800">
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={editDraft.name ?? ""}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({ ...d, name: e.target.value }))
                                }
                                className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              r.name
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <select
                                value={editDraft.roomType ?? "CLASSROOM"}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({ ...d, roomType: e.target.value }))
                                }
                                className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              >
                                <option value="CLASSROOM">CLASSROOM</option>
                                <option value="LAB">LAB</option>
                              </select>
                            ) : (
                              r.roomType
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editDraft.capacity ?? 0}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({
                                    ...d,
                                    capacity: num(e.target.value),
                                  }))
                                }
                                className="w-24 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              r.capacity
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {!isEditing && (
                                <button
                                  onClick={() => startEdit("rooms", r)}
                                  className="px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete("rooms", r.id)}
                                className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {rooms.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={4}>
                          No rooms yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DAYS */}
          {activeTab === "days" && (
            <div className="p-4">
              <div className="text-sm text-stone-500 mb-3">
                Days are enums in DB. This screen is view-only.
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {days.map((d: any) => (
                  <div
                    key={d.id}
                    className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 bg-stone-50 dark:bg-stone-950"
                  >
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-stone-500">ID: {d.id}</div>
                  </div>
                ))}
              </div>
              {days.length === 0 && (
                <div className="text-sm text-stone-500">No days found.</div>
              )}
            </div>
          )}

          {/* SLOTS */}
          {activeTab === "slots" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Add Slot</div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot((s) => ({ ...s, startTime: e.target.value }))}
                    placeholder="Start (HH:MM)"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot((s) => ({ ...s, endTime: e.target.value }))}
                    placeholder="End (HH:MM)"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    type="number"
                    value={newSlot.slotNumber}
                    onChange={(e) => setNewSlot((s) => ({ ...s, slotNumber: num(e.target.value) }))}
                    placeholder="Slot #"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <div className="text-sm text-stone-500 flex items-center">
                    Format: 24h `HH:MM`
                  </div>
                  <button
                    onClick={handleCreateSlot}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Slot #</th>
                      <th className="px-3 py-2">Start</th>
                      <th className="px-3 py-2">End</th>
                      <th className="px-3 py-2 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((sl: any) => {
                      const isEditing = editing?.type === "slots" && editing.id === sl.id;
                      return (
                        <tr key={sl.id} className="border-b border-stone-100 dark:border-stone-800">
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editDraft.slotNumber ?? 0}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({
                                    ...d,
                                    slotNumber: num(e.target.value),
                                  }))
                                }
                                className="w-24 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              sl.slotNumber
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={editDraft.startTime ?? ""}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({ ...d, startTime: e.target.value }))
                                }
                                className="w-24 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              sl.startTime
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={editDraft.endTime ?? ""}
                                onChange={(e) =>
                                  setEditDraft((d: any) => ({ ...d, endTime: e.target.value }))
                                }
                                className="w-24 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                              />
                            ) : (
                              sl.endTime
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {!isEditing && (
                                <button
                                  onClick={() => startEdit("slots", sl)}
                                  className="px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete("slots", sl.id)}
                                className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {slots.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={4}>
                          No slots yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COURSE-SUBJECT */}
          {activeTab === "courseSubject" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Map Course ↔ Subject</div>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  <select
                    value={newCourseSubject.courseId}
                    onChange={(e) =>
                      setNewCourseSubject((s) => ({ ...s, courseId: num(e.target.value) }))
                    }
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newCourseSubject.subjectId}
                    onChange={(e) =>
                      setNewCourseSubject((s) => ({ ...s, subjectId: num(e.target.value) }))
                    }
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={newCourseSubject.semester}
                    onChange={(e) =>
                      setNewCourseSubject((s) => ({ ...s, semester: num(e.target.value) }))
                    }
                    placeholder="Semester"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <input
                    type="number"
                    value={newCourseSubject.lecturesPerWeek}
                    onChange={(e) =>
                      setNewCourseSubject((s) => ({
                        ...s,
                        lecturesPerWeek: num(e.target.value),
                      }))
                    }
                    placeholder="Lectures/week"
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newCourseSubject.isLab}
                      onChange={(e) =>
                        setNewCourseSubject((s) => ({ ...s, isLab: e.target.checked }))
                      }
                    />
                    Lab
                  </label>
                  <div className="text-sm text-stone-500 flex items-center">
                    (Use for semester planning)
                  </div>
                  <button
                    onClick={handleCreateCourseSubject}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-3 py-2">Sem</th>
                      <th className="px-3 py-2">L/W</th>
                      <th className="px-3 py-2">Lab</th>
                      <th className="px-3 py-2 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseSubjects.map((x: any) => (
                      <tr key={x.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-3 py-2">{x.course?.name ?? courseById.get(x.courseId)?.name ?? `#${x.courseId}`}</td>
                        <td className="px-3 py-2">{x.subject?.name ?? subjectById.get(x.subjectId)?.name ?? `#${x.subjectId}`}</td>
                        <td className="px-3 py-2">{x.semester}</td>
                        <td className="px-3 py-2">{x.lecturesPerWeek}</td>
                        <td className="px-3 py-2">{x.isLab ? "Yes" : "No"}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleDelete("courseSubject", x.id)}
                            className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {courseSubjects.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={6}>
                          No mappings yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FACULTY-SUBJECT */}
          {activeTab === "facultySubject" && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4">
                <div className="font-semibold mb-3">Map Faculty ↔ Subject (per Course)</div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <select
                    value={newFacultySubject.facultyId}
                    onChange={(e) =>
                      setNewFacultySubject((s) => ({ ...s, facultyId: num(e.target.value) }))
                    }
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    {faculty.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.user?.name ?? `Faculty #${f.id}`}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newFacultySubject.courseId}
                    onChange={(e) =>
                      setNewFacultySubject((s) => ({ ...s, courseId: num(e.target.value) }))
                    }
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newFacultySubject.subjectId}
                    onChange={(e) =>
                      setNewFacultySubject((s) => ({ ...s, subjectId: num(e.target.value) }))
                    }
                    className="px-3 py-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950"
                  >
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-sm text-stone-500 flex items-center">
                    (Used in timetable generation)
                  </div>
                  <button
                    onClick={handleCreateFacultySubject}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-amber-500 text-white font-semibold disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200 dark:border-stone-700">
                      <th className="px-3 py-2">Faculty</th>
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-3 py-2 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultySubjects.map((x: any) => (
                      <tr key={x.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-3 py-2">{x.faculty?.user?.name ?? `Faculty #${x.facultyId}`}</td>
                        <td className="px-3 py-2">{x.course?.name ?? courseById.get(x.courseId)?.name ?? `#${x.courseId}`}</td>
                        <td className="px-3 py-2">{x.subject?.name ?? subjectById.get(x.subjectId)?.name ?? `#${x.subjectId}`}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleDelete("facultySubject", x.id)}
                            className="px-3 py-1.5 rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {facultySubjects.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-stone-500" colSpan={4}>
                          No mappings yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
