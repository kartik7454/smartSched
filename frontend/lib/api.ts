import { API_BASE } from "./apiBase";

function authHeaders() {
  if (typeof window === "undefined") return undefined;
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function jsonOrThrow(res: Response, message: string) {
  if (res.ok) return res.json();
  let details = "";
  try {
    const data = await res.json();
    details = data?.message ? `: ${data.message}` : "";
  } catch {
    // ignore
  }
  throw new Error(`${message}${details}`);
}

export async function getDepartments(): Promise<
  import("@/types/timetable").Department[]
> {
  const res = await fetch(`${API_BASE}/departments`);
  return jsonOrThrow(res, "Failed to fetch departments");
}

export async function getCourses(): Promise<
  import("@/types/timetable").Course[]
> {
  const res = await fetch(`${API_BASE}/courses`);
  return jsonOrThrow(res, "Failed to fetch courses");
}

export async function getSections(): Promise<
  import("@/types/timetable").Section[]
> {
  const res = await fetch(`${API_BASE}/sections`, {
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to fetch sections");
}

export async function getTimetableBySection(
  sectionId: number
): Promise<import("@/types/timetable").TimetableEntry[]> {
  const res = await fetch(`${API_BASE}/timetables/section/${sectionId}`, {
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to fetch timetable");
}

export async function getFaculty(): Promise<
  import("@/types/timetable").Faculty[]
> {
  const res = await fetch(`${API_BASE}/faculty`);
  return jsonOrThrow(res, "Failed to fetch faculty");
}
///////
export async function getTimetableByFaculty(
  facultyId: number
): Promise<import("@/types/timetable").TimetableEntry[]> {
  const res = await fetch(`${API_BASE}/timetables/faculty/${facultyId}`,{
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to fetch timetable");
}

export async function getSubjects(): Promise<
  { id: number; name: string; isLab: boolean; departmentId: number }[]
> {
  const res = await fetch(`${API_BASE}/subjects`, { headers: authHeaders() });
  return jsonOrThrow(res, "Failed to fetch subjects");
}

export async function getRooms(): Promise<
  { id: number; name: string; roomType: string; capacity: number; departmentId: number }[]
> {
  const res = await fetch(`${API_BASE}/rooms`, { headers: authHeaders() });
  return jsonOrThrow(res, "Failed to fetch rooms");
}

export async function getTimeSlots(): Promise<
  { id: number; startTime: string; endTime: string; slotNumber: number }[]
> {
  const res = await fetch(`${API_BASE}/time-slots`, { headers: authHeaders() });
  return jsonOrThrow(res, "Failed to fetch time slots");
}

export async function getDays(): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`${API_BASE}/days`, { headers: authHeaders() });
  return jsonOrThrow(res, "Failed to fetch days");
}

export async function getAcademicSessions(): Promise<
  { id: number; name: string; isActive: boolean }[]
> {
  const res = await fetch(`${API_BASE}/academic-sessions`, { headers: authHeaders() });
  return jsonOrThrow(res, "Failed to fetch academic sessions");
}

export async function createCourse(dto: {
  name: string;
  departmentId: number;
  durationYears: number;
}) {
  const res = await fetch(`${API_BASE}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create course");
}

export async function updateCourse(id: number, dto: Partial<{ name: string; durationYears: number }>) {
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to update course");
}

export async function deleteCourse(id: number) {
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete course");
}

export async function createSubject(dto: {
  name: string;
  isLab: boolean;
  departmentId: number;
}) {
  const res = await fetch(`${API_BASE}/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create subject");
}

export async function updateSubject(
  id: number,
  dto: Partial<{ name: string; isLab: boolean }>
) {
  const res = await fetch(`${API_BASE}/subjects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to update subject");
}

export async function deleteSubject(id: number) {
  const res = await fetch(`${API_BASE}/subjects/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete subject");
}

export async function createRoom(dto: {
  name: string;
  roomType: string;
  capacity: number;
  departmentId: number;
}) {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create room");
}

export async function updateRoom(
  id: number,
  dto: Partial<{ name: string; roomType: string; capacity: number }>
) {
  const res = await fetch(`${API_BASE}/rooms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to update room");
}

export async function deleteRoom(id: number) {
  const res = await fetch(`${API_BASE}/rooms/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete room");
}

export async function createTimeSlot(dto: {
  startTime: string;
  endTime: string;
  slotNumber: number;
}) {
  const res = await fetch(`${API_BASE}/time-slots`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create time slot");
}

export async function updateTimeSlot(
  id: number,
  dto: Partial<{ startTime: string; endTime: string; slotNumber: number }>
) {
  const res = await fetch(`${API_BASE}/time-slots/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to update time slot");
}

export async function deleteTimeSlot(id: number) {
  const res = await fetch(`${API_BASE}/time-slots/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete time slot");
}

export async function createSection(dto: {
  name: string;
  semester: number;
  batchYear: number;
  courseId: number;
  sessionId: number;
}) {
  const res = await fetch(`${API_BASE}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create section");
}

export async function updateSection(
  id: number,
  dto: Partial<{ name: string; semester: number; batchYear: number; courseId: number; sessionId: number }>
) {
  const res = await fetch(`${API_BASE}/sections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to update section");
}

export async function deleteSection(id: number) {
  const res = await fetch(`${API_BASE}/sections/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete section");
}

export async function getCourseSubjects(): Promise<
  {
    id: number;
    courseId: number;
    subjectId: number;
    semester: number;
    lecturesPerWeek: number;
    isLab: boolean;
    course?: { id: number; name: string };
    subject?: { id: number; name: string; isLab: boolean };
  }[]
> {
  const res = await fetch(`${API_BASE}/course-subject`, { headers: authHeaders() });
  return jsonOrThrow(res, "Failed to fetch course-subject mappings");
}

export async function createCourseSubject(dto: {
  courseId: number;
  subjectId: number;
  semester: number;
  lecturesPerWeek: number;
  isLab: boolean;
}) {
  const res = await fetch(`${API_BASE}/course-subject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create course-subject mapping");
}

export async function deleteCourseSubject(id: number) {
  const res = await fetch(`${API_BASE}/course-subject/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete course-subject mapping");
}

export async function getFacultySubjects(): Promise<
  {
    id: number;
    facultyId: number;
    subjectId: number;
    courseId: number;
    faculty?: { id: number; user?: { name: string } };
    subject?: { id: number; name: string };
    course?: { id: number; name: string };
  }[]
> {
  const res = await fetch(`${API_BASE}/faculty-subject`, { headers: authHeaders() });
  return jsonOrThrow(res, "Failed to fetch faculty-subject mappings");
}

export async function createFacultySubject(dto: {
  facultyId: number;
  subjectId: number;
  courseId: number;
}) {
  const res = await fetch(`${API_BASE}/faculty-subject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create faculty-subject mapping");
}

export async function deleteFacultySubject(id: number) {
  const res = await fetch(`${API_BASE}/faculty-subject/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete faculty-subject mapping");
}

export async function getStudents(): Promise<
  {
    id: number;
    userId: number;
    sectionId: number;
    rollNumber: string;
    user?: { id: number; name: string; email?: string };
    section?: { id: number; name: string; semester: number; course?: { id: number; name: string } };
  }[]
> {
  const res = await fetch(`${API_BASE}/students`, { headers: authHeaders() });
  return jsonOrThrow(res, "Failed to fetch students");
}

export async function createStudent(dto: {
  userId: number;
  sectionId: number;
  rollNumber: string;
}) {
  const res = await fetch(`${API_BASE}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create student");
}

export async function updateStudent(
  id: number,
  dto: Partial<{ userId: number; sectionId: number; rollNumber: string }>
) {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to update student");
}

export async function deleteStudent(id: number) {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete student");
}

export async function createUserViaRegister(dto: {
  name: string;
  email: string;
  password: string;
  roleId: number;
  departmentId?: number;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create user");
}

export async function createFaculty(dto: {
  userId: number;
  departmentId: number;
  maxLecturesPerWeek: number;
}) {
  const res = await fetch(`${API_BASE}/faculty`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to create faculty");
}

export async function updateFaculty(
  id: number,
  dto: Partial<{ maxLecturesPerWeek: number; departmentId: number; userId: number }>
) {
  const res = await fetch(`${API_BASE}/faculty/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    body: JSON.stringify(dto),
  });
  return jsonOrThrow(res, "Failed to update faculty");
}

export async function deleteFaculty(id: number) {
  const res = await fetch(`${API_BASE}/faculty/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res, "Failed to delete faculty");
}
