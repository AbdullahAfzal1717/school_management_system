import { Weekday } from "@/generated/prisma/client";

export type CalendarEvent = {
  title: string;
  start: string;
  end: string;
};

const weekdayIndex: Record<Weekday, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

type LessonInput = {
  name: string;
  day: Weekday;
  startTime: string;
  endTime: string;
  subjectName: string;
  className: string;
};

type ExamInput = {
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
};

function atTime(day: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(day);
  value.setHours(hours || 0, minutes || 0, 0, 0);
  return value;
}

export function buildCalendarEvents(
  lessons: LessonInput[],
  exams: ExamInput[] = [],
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const events: CalendarEvent[] = [];

  for (let week = -1; week <= 6; week += 1) {
    for (const lesson of lessons) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + week * 7 + weekdayIndex[lesson.day]);
      events.push({
        title: `${lesson.name} · ${lesson.className}`,
        start: atTime(day, lesson.startTime).toISOString(),
        end: atTime(day, lesson.endTime).toISOString(),
      });
    }
  }

  for (const exam of exams) {
    events.push({
      title: exam.title,
      start: atTime(exam.date, exam.startTime).toISOString(),
      end: atTime(exam.date, exam.endTime).toISOString(),
    });
  }

  return events;
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
