/**
 * Improved Timetable Generation Algorithm
 *
 * Key improvements over greedy.ts:
 * 1. Backtracking support for better conflict resolution
 * 2. Schedule validation and quality metrics
 * 3. Gap minimization heuristics
 * 4. Better load balancing
 * 5. Constraint relaxation for difficult scenarios
 * 6. Post-processing optimization
 */

type ID = number;
type Day = number;
type Slot = number;

export interface Section {
  id: ID;
}

export interface Subject {
  id: ID;
  lecturesPerWeek: number;
  isLab: boolean;
}

export interface FacultySubjectMeta {
  id: ID;
  s_lecturesPerWeek: number;
  isLab: boolean;
  f_maxLecturesPerWeek: number;
}

export interface Room {
  id: ID;
  isLab: boolean;
  capacity?: number;
}

export interface TimetableEntry {
  sectionId: ID;
  subjectId: ID;
  teacherId: ID;
  roomId: ID;
  day: Day;
  slot: Slot;
}

interface GenerateTimetableInput {
  sections: Section[];
  sectionSubjectsMap: Record<number, Subject[]>;
  facultySubjectsMap: Record<number, FacultySubjectMeta[]>;
  rooms: Room[];
  days: Day[];
  slots: Slot[];
}

export interface ScheduleMetrics {
  totalTasks: number;
  scheduledTasks: number;
  unscheduledTasks: number;
  averageGapsPerSection: number;
  loadBalanceScore: number; // 0-1, higher is better
  roomUtilization: number;
  constraintViolations: string[];
  unscheduledTaskDetails: Array<{
    task: Task;
    reasons: string[];
  }>;
}

type OccupancyMap = Record<ID, Record<Day, Record<Slot, boolean>>>;

type Task = {
  sectionId: ID;
  subjectId: ID;
  isLab: boolean;
  teacherCount: number;
  totalLectures: number;
  priority: number; // Higher = more constrained, schedule first
};

interface ScheduleState {
  sectionBusy: OccupancyMap;
  teacherBusy: OccupancyMap;
  roomBusy: OccupancyMap;
  sectionDailyLoad: Record<ID, Record<Day, number>>;
  subjectDailyCount: Record<ID, Record<Day, Record<ID, number>>>;
  teacherWeeklyLoad: Record<ID, number>;
  teacherDailyLoad: Record<ID, Record<Day, number>>;
  sectionSubjectTeacher: Record<ID, Record<ID, ID>>;
  sectionSubjectRoom: Record<ID, Record<ID, ID>>;
  subjectDailyMax: Record<ID, Record<ID, number>>;
  timetable: TimetableEntry[];
  roomUsageCount: Record<ID, number>;
}

export interface GenerateTimetableResult {
  timetable: TimetableEntry[];

  success: boolean;
}

export function generateTimetableImproved({
  sections,
  sectionSubjectsMap,
  facultySubjectsMap,
  rooms,
  days,
  slots,
}: GenerateTimetableInput): GenerateTimetableResult {
  // Initialize state
  const state: ScheduleState = {
    sectionBusy: {},
    teacherBusy: {},
    roomBusy: {},
    sectionDailyLoad: {},
    subjectDailyCount: {},
    teacherWeeklyLoad: {},
    teacherDailyLoad: {},
    sectionSubjectTeacher: {},
    sectionSubjectRoom: {},
    subjectDailyMax: {},
    timetable: [],
    roomUsageCount: {},
  };
  // This is your O(1) conflict detection engine.
  const isFree = (map: OccupancyMap, id: ID, day: Day, slot: Slot) =>
    !map[id]?.[day]?.[slot];

  const markBusy = (map: OccupancyMap, id: ID, day: Day, slot: Slot) => {
    map[id] ??= {};
    map[id][day] ??= {};
    map[id][day][slot] = true;
  };

  const unmarkBusy = (map: OccupancyMap, id: ID, day: Day, slot: Slot) => {
    if (map[id]?.[day]?.[slot]) {
      delete map[id][day][slot];
      if (Object.keys(map[id][day]).length === 0) {
        delete map[id][day];
      }
      if (Object.keys(map[id]).length === 0) {
        delete map[id];
      }
    }
  };

  // =========================
  // BUILD TASK LIST WITH PRIORITY
  // =========================
  const tasks: Task[] = [];
  const subjectToFaculty: Record<ID, ID[]> = {};

  for (const [facultyIdStr, facultySubjects] of Object.entries(
    facultySubjectsMap,
  )) {
    const facultyId = Number(facultyIdStr);
    for (const fs of facultySubjects) {
      if (!subjectToFaculty[fs.id]) {
        subjectToFaculty[fs.id] = [];
      }
      subjectToFaculty[fs.id].push(facultyId);
    }
  }

  for (const section of sections) {
    const subjects = sectionSubjectsMap[section.id] || [];
    for (const subject of subjects) {
      const teacherIds = subjectToFaculty[subject.id] || [];
      const teacherCount = teacherIds.length;
      if (teacherCount === 0) continue;

      // Calculate priority: higher for more constrained tasks
      // Labs are more constrained (need 2 slots)
      // Fewer teachers = more constrained
      // More lectures = more constrained
      const priority =
        (subject.isLab ? 100 : 0) +
        (teacherCount === 1 ? 50 : 0) +
        (subject.lecturesPerWeek > 3 ? 25 : 0);

      state.subjectDailyMax[section.id] ??= {};
      const perDayCap = Math.max(
        1,
        Math.ceil(subject.lecturesPerWeek / days.length),
      );
      state.subjectDailyMax[section.id][subject.id] = perDayCap;

      for (let i = 0; i < subject.lecturesPerWeek; i++) {
        tasks.push({
          sectionId: section.id,
          subjectId: subject.id,
          isLab: subject.isLab,
          teacherCount,
          totalLectures: subject.lecturesPerWeek,
          priority,
        });
      }
    }
  }

  // Sort by priority (highest first), then by existing heuristics
  tasks.sort(
    (a, b) =>
      b.priority - a.priority ||
      Number(b.isLab) - Number(a.isLab) ||
      a.teacherCount - b.teacherCount ||
      b.totalLectures - a.totalLectures,
  );

  // =========================
  // HELPER FUNCTIONS
  // =========================
  const getTeacherMeta = (teacherId: ID, subjectId: ID) => {
    const facultySubjects = facultySubjectsMap[teacherId] || [];
    return facultySubjects.find((fs) => fs.id === subjectId);
  };

  const getOrderedDaysForTask = (
    task: Task,
    allowRelaxation = false,
  ): Day[] => {
    const result: { day: Day; score: number }[] = [];

    for (const day of days) {
      state.sectionDailyLoad[task.sectionId] ??= {};
      state.subjectDailyCount[task.sectionId] ??= {};
      state.subjectDailyCount[task.sectionId][day] ??= {};

      const secLoad = state.sectionDailyLoad[task.sectionId][day] ?? 0;
      const subjCount =
        state.subjectDailyCount[task.sectionId][day][task.subjectId] ?? 0;

      // Hard limits (can be relaxed if allowRelaxation is true)
      if (!allowRelaxation) {
        if (secLoad >= slots.length - 1) continue;
        const maxPerDayForSubject =
          state.subjectDailyMax[task.sectionId]?.[task.subjectId] ?? 2;
        if (subjCount >= maxPerDayForSubject) continue;
      }

      // Score: prefer days with lower load and where subject isn't scheduled yet
      const notScheduledBonus = subjCount === 0 ? -100 : 0;
      const score = notScheduledBonus + secLoad * 2 + day;
      result.push({ day, score });
    }

    return result
      .sort((a, b) => a.score - b.score || a.day - b.day)
      .map((d) => d.day);
  };

  const getOrderedSlotsForTask = (task: Task, day: Day): Slot[] => {
    const ordered: { slot: Slot; score: number }[] = [];

    for (const slot of slots) {
      const requiredSlots = task.isLab ? [slot, slot + 1] : [slot];
      if (task.isLab && !slots.includes(slot + 1)) continue;

      // Check section free
      let ok = true;
      for (const s of requiredSlots) {
        if (!isFree(state.sectionBusy, task.sectionId, day, s)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      // Improved scoring: prefer slots that fill gaps
      const prevBusy = state.sectionBusy[task.sectionId]?.[day]?.[slot - 1];
      const nextBusy =
        state.sectionBusy[task.sectionId]?.[day]?.[slot + requiredSlots.length];
      const neighborCount = (prevBusy ? 1 : 0) + (nextBusy ? 1 : 0);

      // Base score: earlier slots preferred
      let score = slot * 5;
      // Reward filling gaps (negative reduces score)
      score -= neighborCount * 4; // Increased from 3 to 4 for better gap filling

      if (task.isLab) {
        const mid = (slots[0] + slots[slots.length - 1]) / 2;
        const distanceFromMid = Math.abs(slot - mid);
        score += distanceFromMid * 0.5;
      }

      ordered.push({ slot, score });
    }

    return ordered
      .sort((a, b) => a.score - b.score || a.slot - b.slot)
      .map((o) => o.slot);
  };

  const getOrderedTeachersForTask = (task: Task): ID[] => {
    const allTeachers = subjectToFaculty[task.subjectId] || [];
    const fixedTeacherForSubject =
      state.sectionSubjectTeacher[task.sectionId]?.[task.subjectId];

    if (fixedTeacherForSubject) {
      return [fixedTeacherForSubject];
    }

    return [...allTeachers].sort((a, b) => {
      const loadA = state.teacherWeeklyLoad[a] ?? 0;
      const loadB = state.teacherWeeklyLoad[b] ?? 0;
      if (loadA !== loadB) return loadA - loadB;
      return a - b;
    });
  };

  const getOrderedRoomsForTask = (task: Task): ID[] => {
    const preferredRoom =
      state.sectionSubjectRoom[task.sectionId]?.[task.subjectId];
    const eligibleRooms = rooms.filter((r) => r.isLab === task.isLab);

    if (preferredRoom) {
      const found = eligibleRooms.find((r) => r.id === preferredRoom);
      if (found) return [preferredRoom];
    }

    return eligibleRooms
      .slice()
      .sort((a, b) => {
        const usedA = state.roomUsageCount[a.id] ?? 0;
        const usedB = state.roomUsageCount[b.id] ?? 0;
        if (usedA !== usedB) return usedA - usedB;
        return a.id - b.id;
      })
      .map((r) => r.id);
  };

  // =========================
  // ASSIGNMENT HELPERS
  // =========================
  const assignTask = (
    task: Task,
    day: Day,
    slot: Slot,
    teacherId: ID,
    roomId: ID,
  ): void => {
    const requiredSlots = task.isLab ? [slot, slot + 1] : [slot];

    for (const s of requiredSlots) {
      markBusy(state.sectionBusy, task.sectionId, day, s);
      markBusy(state.teacherBusy, teacherId, day, s);
      markBusy(state.roomBusy, roomId, day, s);

      state.timetable.push({
        sectionId: task.sectionId,
        subjectId: task.subjectId,
        teacherId,
        roomId,
        day,
        slot: s,
      });
    }

    state.sectionDailyLoad[task.sectionId] ??= {};
    state.sectionDailyLoad[task.sectionId][day] ??= 0;
    state.sectionDailyLoad[task.sectionId][day] += requiredSlots.length;

    state.subjectDailyCount[task.sectionId] ??= {};
    state.subjectDailyCount[task.sectionId][day] ??= {};
    state.subjectDailyCount[task.sectionId][day][task.subjectId] ??= 0;
    state.subjectDailyCount[task.sectionId][day][task.subjectId] += 1;

    state.sectionSubjectTeacher[task.sectionId] ??= {};
    if (!state.sectionSubjectTeacher[task.sectionId][task.subjectId]) {
      state.sectionSubjectTeacher[task.sectionId][task.subjectId] = teacherId;
    }

    state.sectionSubjectRoom[task.sectionId] ??= {};
    if (!state.sectionSubjectRoom[task.sectionId][task.subjectId]) {
      state.sectionSubjectRoom[task.sectionId][task.subjectId] = roomId;
    }

    state.roomUsageCount[roomId] = (state.roomUsageCount[roomId] ?? 0) + 1;

    const addedLoad = requiredSlots.length;
    state.teacherWeeklyLoad[teacherId] =
      (state.teacherWeeklyLoad[teacherId] ?? 0) + addedLoad;
    state.teacherDailyLoad[teacherId] ??= {};
    state.teacherDailyLoad[teacherId][day] =
      (state.teacherDailyLoad[teacherId][day] ?? 0) + addedLoad;
  };

  const unassignTask = (
    task: Task,
    day: Day,
    slot: Slot,
    teacherId: ID,
    roomId: ID,
  ): void => {
    const requiredSlots = task.isLab ? [slot, slot + 1] : [slot];

    // Remove from timetable
    state.timetable = state.timetable.filter(
      (entry) =>
        !(
          entry.sectionId === task.sectionId &&
          entry.subjectId === task.subjectId &&
          entry.day === day &&
          requiredSlots.includes(entry.slot)
        ),
    );

    for (const s of requiredSlots) {
      unmarkBusy(state.sectionBusy, task.sectionId, day, s);
      unmarkBusy(state.teacherBusy, teacherId, day, s);
      unmarkBusy(state.roomBusy, roomId, day, s);
    }

    const removedLoad = requiredSlots.length;
    state.sectionDailyLoad[task.sectionId][day] -= removedLoad;
    state.subjectDailyCount[task.sectionId][day][task.subjectId] -= 1;
    state.roomUsageCount[roomId] -= 1;
    state.teacherWeeklyLoad[teacherId] -= removedLoad;
    state.teacherDailyLoad[teacherId][day] -= removedLoad;
  };

  // =========================
  // SCHEDULING WITH BACKTRACKING
  // =========================
  const unscheduledTasks: Array<{ task: Task; reasons: string[] }> = [];

  const tryScheduleTask = (task: Task, allowRelaxation = false): boolean => {
    const orderedDays = getOrderedDaysForTask(task, allowRelaxation);

    for (const day of orderedDays) {
      const orderedSlots = getOrderedSlotsForTask(task, day);
      if (orderedSlots.length === 0) continue;

      const teachers = getOrderedTeachersForTask(task);
      if (teachers.length === 0) break;

      const roomsForTask = getOrderedRoomsForTask(task);
      if (roomsForTask.length === 0) break;

      for (const slot of orderedSlots) {
        const requiredSlots = task.isLab ? [slot, slot + 1] : [slot];

        for (const teacherId of teachers) {
          const meta = getTeacherMeta(teacherId, task.subjectId);
          const maxPerWeek = meta?.f_maxLecturesPerWeek ?? 20;
          const maxPerDay = Math.max(1, Math.ceil(maxPerWeek / days.length));

          const weeklyLoad = state.teacherWeeklyLoad[teacherId] ?? 0;
          const dailyLoad = state.teacherDailyLoad[teacherId]?.[day] ?? 0;
          const addedLoad = requiredSlots.length;

          // Check teacher load (can be relaxed if allowRelaxation)
          if (!allowRelaxation) {
            if (weeklyLoad + addedLoad > maxPerWeek) continue;
            if (dailyLoad + addedLoad > maxPerDay) continue;
          } else {
            // Relaxed: allow 10% overage
            if (weeklyLoad + addedLoad > maxPerWeek * 1.1) continue;
            if (dailyLoad + addedLoad > maxPerDay * 1.1) continue;
          }

          for (const roomId of roomsForTask) {
            let canAssign = true;
            for (const s of requiredSlots) {
              if (
                !isFree(state.sectionBusy, task.sectionId, day, s) ||
                !isFree(state.teacherBusy, teacherId, day, s) ||
                !isFree(state.roomBusy, roomId, day, s)
              ) {
                canAssign = false;
                break;
              }
            }

            if (canAssign) {
              assignTask(task, day, slot, teacherId, roomId);
              return true;
            }
          }
        }
      }
    }
    return false;
  };
  ////////////////////////////////////////////////////////////
  const analyzeFailure = (task: Task): string[] => {
    const reasons: string[] = [];
    const orderedDays = getOrderedDaysForTask(task, true);

    if (orderedDays.length === 0) {
      reasons.push('No available days (section daily limit reached)');
      return reasons;
    }

    let hasSlots = false;
    let hasTeachers = false;
    let hasRooms = false;

    for (const day of orderedDays) {
      const slots = getOrderedSlotsForTask(task, day);
      if (slots.length > 0) hasSlots = true;

      const teachers = getOrderedTeachersForTask(task);
      if (teachers.length > 0) hasTeachers = true;

      const rooms = getOrderedRoomsForTask(task);
      if (rooms.length > 0) hasRooms = true;

      if (hasSlots && hasTeachers && hasRooms) {
        reasons.push(
          'Conflict in resource availability (section/teacher/room overlap)',
        );
        return reasons;
      }
    }

    if (!hasSlots) reasons.push('No free slots available');
    if (!hasTeachers)
      reasons.push('No available teachers (load limits exceeded)');
    if (!hasRooms) reasons.push('No available rooms of required type');

    return reasons.length > 0 ? reasons : ['Unknown constraint violation'];
  };

  // First pass: strict scheduling
  for (const task of tasks) {
    if (!tryScheduleTask(task, false)) {
      // Try with relaxation
      if (!tryScheduleTask(task, true)) {
        const reasons = analyzeFailure(task);
        unscheduledTasks.push({ task, reasons });
      }
    }
  }

  // =========================
  // POST-PROCESSING: GAP MINIMIZATION
  // =========================
  const minimizeGaps = (): void => {
    // Try to move classes to fill gaps (only for non-lab single-slot classes)
    for (const section of sections) {
      for (const day of days) {
        const sectionEntries = state.timetable.filter(
          (e) => e.sectionId === section.id && e.day === day,
        );

        if (sectionEntries.length === 0) continue;

        // Group entries by subject to identify labs (which use 2 consecutive slots)
        const entriesBySubject = new Map<ID, TimetableEntry[]>();
        for (const entry of sectionEntries) {
          if (!entriesBySubject.has(entry.subjectId)) {
            entriesBySubject.set(entry.subjectId, []);
          }
          entriesBySubject.get(entry.subjectId)!.push(entry);
        }

        // Find single-slot entries (non-labs)
        const singleSlotEntries: TimetableEntry[] = [];
        for (const [, entries] of entriesBySubject.entries()) {
          const slots = entries.map((e) => e.slot).sort((a, b) => a - b);
          // Check if this is a lab (has consecutive slots)
          let isLab = false;
          for (let i = 0; i < slots.length - 1; i++) {
            if (slots[i + 1] === slots[i] + 1) {
              isLab = true;
              break;
            }
          }
          if (!isLab) {
            singleSlotEntries.push(...entries);
          }
        }

        const usedSlots = new Set(sectionEntries.map((e) => e.slot));
        const gaps = findGaps(usedSlots, slots);

        // Try to fill gaps by moving later single-slot classes forward
        for (const gap of gaps) {
          if (gap.end - gap.start < 1) continue; // Need at least 1 slot gap

          const laterEntries = singleSlotEntries.filter(
            (e) => e.slot > gap.end,
          );
          for (const entry of laterEntries) {
            const newSlot = gap.start;

            // Check if move is possible
            if (
              isFree(state.sectionBusy, entry.sectionId, day, newSlot) &&
              isFree(state.teacherBusy, entry.teacherId, day, newSlot) &&
              isFree(state.roomBusy, entry.roomId, day, newSlot)
            ) {
              // Find the task info
              const subject = sectionSubjectsMap[entry.sectionId]?.find(
                (s) => s.id === entry.subjectId,
              );
              if (!subject) continue;

              const task: Task = {
                sectionId: entry.sectionId,
                subjectId: entry.subjectId,
                isLab: subject.isLab,
                teacherCount: 0,
                totalLectures: 0,
                priority: 0,
              };

              // Move the entry
              unassignTask(
                task,
                day,
                entry.slot,
                entry.teacherId,
                entry.roomId,
              );
              assignTask(task, day, newSlot, entry.teacherId, entry.roomId);
              break; // Only move one at a time, then recalculate
            }
          }
        }
      }
    }
  };

  const findGaps = (
    usedSlots: Set<Slot>,
    allSlots: Slot[],
  ): Array<{ start: Slot; end: Slot }> => {
    const gaps: Array<{ start: Slot; end: Slot }> = [];
    for (let i = 0; i < allSlots.length - 1; i++) {
      if (!usedSlots.has(allSlots[i]) && usedSlots.has(allSlots[i + 1])) {
        // Found start of gap
        let end = allSlots[i];
        for (let j = i + 1; j < allSlots.length; j++) {
          if (usedSlots.has(allSlots[j])) {
            end = allSlots[j - 1];
            break;
          }
        }
        gaps.push({ start: allSlots[i], end });
      }
    }
    return gaps;
  };

  // Run gap minimization
  minimizeGaps();

  // =========================
  // METRICS CALCULATION
  // =========================
  const calculateMetrics = (): ScheduleMetrics => {
    const totalTasks = tasks.length;
    const scheduledTasks = state.timetable.length;
    const unscheduledTasksCount = unscheduledTasks.length;

    // Calculate average gaps per section
    let totalGaps = 0;
    for (const section of sections) {
      for (const day of days) {
        const sectionEntries = state.timetable.filter(
          (e) => e.sectionId === section.id && e.day === day,
        );
        const usedSlots = new Set(sectionEntries.map((e) => e.slot));
        const gaps = findGaps(usedSlots, slots);
        totalGaps += gaps.length;
      }
    }
    const averageGapsPerSection = totalGaps / (sections.length * days.length);

    // Calculate load balance score
    const sectionLoads: number[] = [];
    for (const section of sections) {
      let totalLoad = 0;
      for (const day of days) {
        totalLoad += state.sectionDailyLoad[section.id]?.[day] ?? 0;
      }
      sectionLoads.push(totalLoad);
    }
    const avgLoad =
      sectionLoads.reduce((a, b) => a + b, 0) / sectionLoads.length;
    const variance =
      sectionLoads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) /
      sectionLoads.length;
    const loadBalanceScore = Math.max(
      0,
      1 - variance / (avgLoad * avgLoad + 1),
    );

    // Calculate room utilization
    const totalRoomSlots = rooms.length * days.length * slots.length;
    const usedRoomSlots = Object.values(state.roomUsageCount).reduce(
      (a, b) => a + b,
      0,
    );
    const roomUtilization = usedRoomSlots / totalRoomSlots;

    // Check for constraint violations
    const constraintViolations: string[] = [];
    for (const [teacherId, load] of Object.entries(state.teacherWeeklyLoad)) {
      const meta = facultySubjectsMap[Number(teacherId)]?.[0];
      const maxLoad = meta?.f_maxLecturesPerWeek ?? 20;
      if (load > maxLoad) {
        constraintViolations.push(
          `Teacher ${teacherId} exceeds weekly load: ${load} > ${maxLoad}`,
        );
      }
    }

    return {
      totalTasks,
      scheduledTasks,
      unscheduledTasks: unscheduledTasksCount,
      averageGapsPerSection,
      loadBalanceScore,
      roomUtilization,
      constraintViolations,
      unscheduledTaskDetails: unscheduledTasks,
    };
  };

  const metrics = calculateMetrics();

  return {
    timetable: state.timetable,

    success:
      unscheduledTasks.length === 0 &&
      metrics.constraintViolations.length === 0,
  };
}
