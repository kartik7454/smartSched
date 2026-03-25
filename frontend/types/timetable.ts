export type DayEnum =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface Department {
  id: number;
  name: string;
}

export interface Course {
  id: number;
  name: string;
  durationYears: number;
  departmentId: number;
  department?: Department;
}

export interface Section {
  id: number;
  name: string;
  semester: number;
  batchYear: number;
  courseId: number;
  sessionId: number;
  course?: { id: number; name: string };
  session?: { id: number; name: string };
}

export interface Faculty {
  id: number;
  userId: number;
  departmentId: number;
  user?: { id: number; name: string };
  department?: { id: number; name: string };
}

export interface TimetableEntry {
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
  day: { id: number; name: DayEnum };
  timeSlot: { id: number; startTime: string; endTime: string; slotNumber: number };
  section?: { id: number; name: string; semester: number; course?: { id: number; name: string } };
}

export const DAY_ORDER: DayEnum[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
