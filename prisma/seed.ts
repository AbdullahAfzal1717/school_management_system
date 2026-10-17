import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AttendanceStatus,
  PrismaClient,
  UserRole,
  Weekday,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const FIRST_NAMES = [
  "Sara", "Noah", "Emma", "Liam", "Olivia", "Ava", "Ethan", "Mia", "Lucas", "Sophia",
  "James", "Amelia", "Benjamin", "Harper", "Henry", "Evelyn", "Alexander", "Abigail", "Daniel", "Ella",
  "Michael", "Scarlett", "William", "Grace", "David", "Chloe", "Joseph", "Victoria", "Samuel", "Lily",
  "Owen", "Hannah", "Jack", "Zoe", "Leo", "Nora", "Ryan", "Aria", "Nathan", "Layla",
  "Adam", "Riley", "Isaac", "Penelope", "Caleb", "Stella", "Aaron", "Maya", "Eli", "Hazel",
];

const LAST_NAMES = [
  "Student", "Khan", "Ali", "Ahmed", "Hassan", "Iqbal", "Malik", "Raza", "Shah", "Butt",
  "Qureshi", "Siddiqui", "Farooq", "Nawaz", "Tariq", "Javed", "Aslam", "Hussain", "Rehman", "Baig",
];

const SUBJECTS = [
  "Mathematics", "English", "Physics", "Chemistry", "Biology",
  "History", "Geography", "Computer Science", "Art",
];

const CLASSES = [
  { name: "5A", grade: 5 },
  { name: "5B", grade: 5 },
  { name: "6A", grade: 6 },
  { name: "6B", grade: 6 },
  { name: "7A", grade: 7 },
  { name: "7B", grade: 7 },
  { name: "8A", grade: 8 },
  { name: "9A", grade: 9 },
];

const WEEKDAYS: Weekday[] = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
];

const TIMES = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00"];

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function utcDay(offset: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
}

function addHours(time: string, hours: number) {
  const [hour, minute] = time.split(":").map(Number);
  return `${String(hour + hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

async function upsertNamed<T extends { id: string }>(
  find: () => Promise<T | null>,
  update: (id: string) => Promise<T>,
  create: () => Promise<T>,
) {
  const existing = await find();
  return existing ? update(existing.id) : create();
}

async function main() {
  const rand = createRng(20261017);
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@school.local" },
    update: {
      passwordHash,
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.ADMIN,
    },
    create: {
      email: "admin@school.local",
      passwordHash,
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.ADMIN,
    },
  });

  const previousYear = await prisma.academicYear.upsert({
    where: { name: "2025-2026" },
    update: {
      isCurrent: false,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
    },
    create: {
      name: "2025-2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: false,
    },
  });

  const currentYear = await prisma.academicYear.upsert({
    where: { name: "2026-2027" },
    update: {
      isCurrent: true,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
    },
    create: {
      name: "2026-2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      isCurrent: true,
    },
  });

  await prisma.academicYear.updateMany({
    where: { id: { not: currentYear.id } },
    data: { isCurrent: false },
  });

  const subjects = [];
  for (const name of SUBJECTS) {
    subjects.push(
      await prisma.subject.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    );
  }

  const teacherCount = 14;
  const teachers = [];
  for (let index = 0; index < teacherCount; index += 1) {
    const email = index === 0 ? "teacher@school.local" : `teacher${String(index + 1).padStart(2, "0")}@school.local`;
    const firstName = index === 0 ? "John" : FIRST_NAMES[(index + 7) % FIRST_NAMES.length];
    const lastName = index === 0 ? "Teacher" : LAST_NAMES[(index + 3) % LAST_NAMES.length];
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, firstName, lastName, role: UserRole.TEACHER },
      create: { email, passwordHash, firstName, lastName, role: UserRole.TEACHER },
    });
    const profile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        employeeId: `T-${1001 + index}`,
        phone: `555-01${String(index).padStart(2, "0")}`,
        address: `${10 + index} Faculty Road`,
      },
      create: {
        userId: user.id,
        employeeId: `T-${1001 + index}`,
        phone: `555-01${String(index).padStart(2, "0")}`,
        address: `${10 + index} Faculty Road`,
      },
    });
    teachers.push(profile);
  }

  const classes = [];
  for (let index = 0; index < CLASSES.length; index += 1) {
    const spec = CLASSES[index];
    classes.push(
      await prisma.schoolClass.upsert({
        where: {
          name_academicYearId: { name: spec.name, academicYearId: currentYear.id },
        },
        update: {
          grade: spec.grade,
          capacity: 30,
          supervisorId: teachers[index % teachers.length].id,
        },
        create: {
          name: spec.name,
          grade: spec.grade,
          capacity: 30,
          academicYearId: currentYear.id,
          supervisorId: teachers[index % teachers.length].id,
        },
      }),
    );
  }

  await prisma.schoolClass.upsert({
    where: {
      name_academicYearId: { name: "5A", academicYearId: previousYear.id },
    },
    update: { grade: 5, capacity: 30 },
    create: {
      name: "5A",
      grade: 5,
      capacity: 30,
      academicYearId: previousYear.id,
    },
  });

  const studentCount = 72;
  const students = [];
  for (let index = 0; index < studentCount; index += 1) {
    const email = index === 0 ? "student@school.local" : `student${String(index + 1).padStart(2, "0")}@school.local`;
    const firstName = index === 0 ? "Sara" : FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = index === 0 ? "Student" : LAST_NAMES[index % LAST_NAMES.length];
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, firstName, lastName, role: UserRole.STUDENT },
      create: { email, passwordHash, firstName, lastName, role: UserRole.STUDENT },
    });
    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        studentNumber: `S-${1001 + index}`,
        phone: `555-02${String(index % 100).padStart(2, "0")}`,
        address: `${20 + (index % 40)} Student Street`,
      },
      create: {
        userId: user.id,
        studentNumber: `S-${1001 + index}`,
        phone: `555-02${String(index % 100).padStart(2, "0")}`,
        address: `${20 + (index % 40)} Student Street`,
      },
    });
    const schoolClass = classes[index % classes.length];
    await prisma.enrollment.upsert({
      where: {
        studentId_academicYearId: {
          studentId: profile.id,
          academicYearId: currentYear.id,
        },
      },
      update: { schoolClassId: schoolClass.id },
      create: {
        studentId: profile.id,
        schoolClassId: schoolClass.id,
        academicYearId: currentYear.id,
      },
    });
    students.push({ ...profile, classId: schoolClass.id, className: schoolClass.name });
  }

  const parentCount = 45;
  const parents = [];
  for (let index = 0; index < parentCount; index += 1) {
    const email = index === 0 ? "parent@school.local" : `parent${String(index + 1).padStart(2, "0")}@school.local`;
    const firstName = index === 0 ? "Alex" : FIRST_NAMES[(index + 11) % FIRST_NAMES.length];
    const lastName = index === 0 ? "Parent" : LAST_NAMES[(index + 5) % LAST_NAMES.length];
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, firstName, lastName, role: UserRole.PARENT },
      create: { email, passwordHash, firstName, lastName, role: UserRole.PARENT },
    });
    const profile = await prisma.parentProfile.upsert({
      where: { userId: user.id },
      update: {
        phone: `555-03${String(index % 100).padStart(2, "0")}`,
        address: `${30 + index} Parent Road`,
      },
      create: {
        userId: user.id,
        phone: `555-03${String(index % 100).padStart(2, "0")}`,
        address: `${30 + index} Parent Road`,
      },
    });
    parents.push({ ...profile, userId: user.id });
  }

  const childLinks: { parentIndex: number; studentIndex: number }[] = [];
  let studentCursor = 0;
  for (let index = 0; index < parents.length && studentCursor < students.length; index += 1) {
    childLinks.push({ parentIndex: index, studentIndex: studentCursor });
    studentCursor += 1;
    if (index < 20 && studentCursor < students.length) {
      childLinks.push({ parentIndex: index, studentIndex: studentCursor });
      studentCursor += 1;
    }
  }

  for (const link of childLinks) {
    await prisma.parentStudent.upsert({
      where: {
        parentId_studentId: {
          parentId: parents[link.parentIndex].id,
          studentId: students[link.studentIndex].id,
        },
      },
      update: { relationship: "Parent" },
      create: {
        parentId: parents[link.parentIndex].id,
        studentId: students[link.studentIndex].id,
        relationship: "Parent",
      },
    });
  }

  const taughtSubjects = subjects.slice(0, 6);
  const assignments = [];
  for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
    for (let subjectIndex = 0; subjectIndex < taughtSubjects.length; subjectIndex += 1) {
      const teacher = teachers[(classIndex + subjectIndex) % teachers.length];
      if (classIndex === 0 && subjectIndex < 2) {
        assignments.push({
          teacherId: teachers[0].id,
          subjectId: taughtSubjects[subjectIndex].id,
          schoolClassId: classes[0].id,
          subjectName: taughtSubjects[subjectIndex].name,
          className: classes[0].name,
        });
        continue;
      }
      assignments.push({
        teacherId: teacher.id,
        subjectId: taughtSubjects[subjectIndex].id,
        schoolClassId: classes[classIndex].id,
        subjectName: taughtSubjects[subjectIndex].name,
        className: classes[classIndex].name,
      });
    }
  }

  for (const item of assignments) {
    await prisma.teachingAssignment.upsert({
      where: {
        teacherId_subjectId_schoolClassId_academicYearId: {
          teacherId: item.teacherId,
          subjectId: item.subjectId,
          schoolClassId: item.schoolClassId,
          academicYearId: currentYear.id,
        },
      },
      update: {},
      create: {
        teacherId: item.teacherId,
        subjectId: item.subjectId,
        schoolClassId: item.schoolClassId,
        academicYearId: currentYear.id,
      },
    });
  }

  for (let index = 0; index < assignments.length; index += 1) {
    const item = assignments[index];
    const day = WEEKDAYS[index % WEEKDAYS.length];
    const startTime = TIMES[index % TIMES.length];
    const name = `${item.subjectName} · ${item.className}`;
    const data = {
      day,
      startTime,
      endTime: addHours(startTime, 1),
      subjectId: item.subjectId,
      classId: item.schoolClassId,
      teacherId: item.teacherId,
    };
    await upsertNamed(
      () => prisma.lesson.findFirst({ where: { name, classId: item.schoolClassId } }),
      (id) => prisma.lesson.update({ where: { id }, data }),
      () => prisma.lesson.create({ data: { name, ...data } }),
    );
  }

  const examPlans = assignments.slice(0, 12);
  for (let index = 0; index < examPlans.length; index += 1) {
    const item = examPlans[index];
    const title = `${item.subjectName} ${item.className} Assessment`;
    const exam = await upsertNamed(
      () => prisma.exam.findFirst({ where: { title } }),
      (id) =>
        prisma.exam.update({
          where: { id },
          data: {
            date: utcDay(7 + index * 3),
            startTime: "09:00",
            endTime: "11:00",
            subjectId: item.subjectId,
            classId: item.schoolClassId,
            teacherId: item.teacherId,
          },
        }),
      () =>
        prisma.exam.create({
          data: {
            title,
            date: utcDay(7 + index * 3),
            startTime: "09:00",
            endTime: "11:00",
            subjectId: item.subjectId,
            classId: item.schoolClassId,
            teacherId: item.teacherId,
          },
        }),
    );
    const classStudents = students.filter((student) => student.classId === item.schoolClassId);
    for (const student of classStudents) {
      const score = 55 + Math.floor(rand() * 46);
      await prisma.examResult.upsert({
        where: { examId_studentId: { examId: exam.id, studentId: student.id } },
        update: { score },
        create: { examId: exam.id, studentId: student.id, score },
      });
    }
  }

  const homeworkPlans = assignments.slice(0, 18);
  for (let index = 0; index < homeworkPlans.length; index += 1) {
    const item = homeworkPlans[index];
    const title = `${item.subjectName} ${item.className} Homework`;
    const data = {
      startDate: utcDay(-7 + index),
      dueDate: utcDay(7 + index),
      subjectId: item.subjectId,
      classId: item.schoolClassId,
      teacherId: item.teacherId,
    };
    await upsertNamed(
      () => prisma.assignment.findFirst({ where: { title } }),
      (id) => prisma.assignment.update({ where: { id }, data }),
      () => prisma.assignment.create({ data: { title, ...data } }),
    );
  }

  const attendanceRows = [];
  for (let dayOffset = -13; dayOffset <= 0; dayOffset += 1) {
    const date = utcDay(dayOffset);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const student of students) {
      const roll = rand();
      const status =
        roll < 0.8
          ? AttendanceStatus.PRESENT
          : roll < 0.92
            ? AttendanceStatus.LATE
            : AttendanceStatus.ABSENT;
      attendanceRows.push({
        studentId: student.id,
        classId: student.classId,
        date,
        status,
      });
    }
  }

  await prisma.attendance.deleteMany({
    where: { date: { gte: utcDay(-13), lte: utcDay(0) } },
  });
  await prisma.attendance.createMany({ data: attendanceRows });

  const eventTitles = [
    "Science Fair",
    "Parent Teacher Meeting",
    "Sports Day",
    "Library Week",
    "Art Exhibition",
    "Math Olympiad",
    "Career Talk",
    "Reading Morning",
    "Health Check",
    "Music Assembly",
    "Field Trip",
    "Award Ceremony",
  ];
  for (let index = 0; index < eventTitles.length; index += 1) {
    const classId = index % 3 === 0 ? null : classes[index % classes.length].id;
    const data = {
      description: `${eventTitles[index]} for the school community.`,
      date: utcDay(2 + index * 4),
      startTime: "09:00",
      endTime: "12:00",
      classId,
    };
    await upsertNamed(
      () => prisma.event.findFirst({ where: { title: eventTitles[index] } }),
      (id) => prisma.event.update({ where: { id }, data }),
      () => prisma.event.create({ data: { title: eventTitles[index], ...data } }),
    );
  }

  const announcementTitles = [
    "Welcome back to the new term",
    "Uniform reminder",
    "Exam timetable posted",
    "Library hours extended",
    "Sports trials this week",
    "Fee receipt collection",
    "Science club signup",
    "Bus route update",
    "Assembly on Monday",
    "Lost and found",
    "Computer lab booking",
    "Health and safety drill",
    "Reading challenge",
    "Parent portal notice",
    "Holiday schedule",
    "Classroom supplies",
    "Guest speaker",
    "Report cards next month",
  ];
  for (let index = 0; index < announcementTitles.length; index += 1) {
    const data = {
      content: `${announcementTitles[index]}. Please check with your class teacher for details.`,
      date: utcDay(-10 + index),
      classId: index % 4 === 0 ? null : classes[index % classes.length].id,
      authorId: admin.id,
    };
    await upsertNamed(
      () => prisma.announcement.findFirst({ where: { title: announcementTitles[index] } }),
      (id) => prisma.announcement.update({ where: { id }, data }),
      () => prisma.announcement.create({ data: { title: announcementTitles[index], ...data } }),
    );
  }

  const messagePairs = [
    { from: admin.id, to: teachers[0].userId, subject: "Staff meeting Friday", body: "Please join the weekly staff meeting in the conference room." },
    { from: teachers[0].userId, to: admin.id, subject: "5A progress update", body: "Class 5A is on track for the upcoming assessments." },
    { from: parents[0].userId, to: teachers[0].userId, subject: "Sara's attendance", body: "Could you confirm Sara's attendance for last week?" },
    { from: teachers[0].userId, to: parents[0].userId, subject: "Re: Sara's attendance", body: "Sara has been present for every lesson this week." },
    { from: students[0].userId, to: teachers[0].userId, subject: "Homework question", body: "I have a question about the mathematics homework." },
    { from: teachers[0].userId, to: students[0].userId, subject: "Re: Homework question", body: "Review example 3 in your notes and try the problem again." },
  ];

  for (let index = messagePairs.length; index < 24; index += 1) {
    const teacher = teachers[index % teachers.length];
    const senderIsAdmin = index % 2 === 0;
    messagePairs.push({
      from: senderIsAdmin ? admin.id : teacher.userId,
      to: senderIsAdmin ? teacher.userId : admin.id,
      subject: `Weekly note ${index + 1}`,
      body: "This is a routine school message about classes, attendance, and upcoming work.",
    });
  }

  for (const message of messagePairs) {
    const existing = await prisma.message.findFirst({
      where: {
        senderId: message.from,
        receiverId: message.to,
        subject: message.subject,
      },
    });
    if (existing) {
      await prisma.message.update({
        where: { id: existing.id },
        data: { body: message.body, read: false },
      });
    } else {
      await prisma.message.create({
        data: {
          senderId: message.from,
          receiverId: message.to,
          subject: message.subject,
          body: message.body,
          read: false,
        },
      });
    }
  }

  console.log("Development database seeded successfully.");
  console.log("Demo password for all accounts: password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
