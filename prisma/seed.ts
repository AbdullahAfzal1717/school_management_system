import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "admin@school.local" },
    update: {
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

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@school.local" },
    update: { firstName: "John", lastName: "Teacher", role: UserRole.TEACHER },
    create: {
      email: "teacher@school.local",
      passwordHash,
      firstName: "John",
      lastName: "Teacher",
      role: UserRole.TEACHER,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@school.local" },
    update: { firstName: "Sara", lastName: "Student", role: UserRole.STUDENT },
    create: {
      email: "student@school.local",
      passwordHash,
      firstName: "Sara",
      lastName: "Student",
      role: UserRole.STUDENT,
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@school.local" },
    update: { firstName: "Alex", lastName: "Parent", role: UserRole.PARENT },
    create: {
      email: "parent@school.local",
      passwordHash,
      firstName: "Alex",
      lastName: "Parent",
      role: UserRole.PARENT,
    },
  });

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: {
      employeeId: "T-1001",
      phone: "555-0101",
      address: "Teacher Avenue",
    },
    create: {
      userId: teacher.id,
      employeeId: "T-1001",
      phone: "555-0101",
      address: "Teacher Avenue",
    },
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      studentNumber: "S-1001",
      phone: "555-0202",
      address: "Student Street",
    },
    create: {
      userId: student.id,
      studentNumber: "S-1001",
      phone: "555-0202",
      address: "Student Street",
    },
  });

  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parent.id },
    update: { phone: "555-0303", address: "Parent Road" },
    create: {
      userId: parent.id,
      phone: "555-0303",
      address: "Parent Road",
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2026-2027" },
    update: { isCurrent: true },
    create: {
      name: "2026-2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      isCurrent: true,
    },
  });

  const class5A = await prisma.schoolClass.upsert({
    where: {
      name_academicYearId: { name: "5A", academicYearId: academicYear.id },
    },
    update: { grade: 5, capacity: 25, supervisorId: teacherProfile.id },
    create: {
      name: "5A",
      grade: 5,
      capacity: 25,
      academicYearId: academicYear.id,
      supervisorId: teacherProfile.id,
    },
  });

  const class6B = await prisma.schoolClass.upsert({
    where: {
      name_academicYearId: { name: "6B", academicYearId: academicYear.id },
    },
    update: { grade: 6, capacity: 25 },
    create: {
      name: "6B",
      grade: 6,
      capacity: 25,
      academicYearId: academicYear.id,
    },
  });

  const math = await prisma.subject.upsert({
    where: { name: "Mathematics" },
    update: {},
    create: { name: "Mathematics" },
  });

  const english = await prisma.subject.upsert({
    where: { name: "English" },
    update: {},
    create: { name: "English" },
  });

  const physics = await prisma.subject.upsert({
    where: { name: "Physics" },
    update: {},
    create: { name: "Physics" },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_academicYearId: {
        studentId: studentProfile.id,
        academicYearId: academicYear.id,
      },
    },
    update: { schoolClassId: class5A.id },
    create: {
      studentId: studentProfile.id,
      schoolClassId: class5A.id,
      academicYearId: academicYear.id,
    },
  });

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parentProfile.id,
        studentId: studentProfile.id,
      },
    },
    update: { relationship: "Parent" },
    create: {
      parentId: parentProfile.id,
      studentId: studentProfile.id,
      relationship: "Parent",
    },
  });

  await prisma.teachingAssignment.upsert({
    where: {
      teacherId_subjectId_schoolClassId_academicYearId: {
        teacherId: teacherProfile.id,
        subjectId: math.id,
        schoolClassId: class5A.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      teacherId: teacherProfile.id,
      subjectId: math.id,
      schoolClassId: class5A.id,
      academicYearId: academicYear.id,
    },
  });

  await prisma.teachingAssignment.upsert({
    where: {
      teacherId_subjectId_schoolClassId_academicYearId: {
        teacherId: teacherProfile.id,
        subjectId: english.id,
        schoolClassId: class5A.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      teacherId: teacherProfile.id,
      subjectId: english.id,
      schoolClassId: class5A.id,
      academicYearId: academicYear.id,
    },
  });

  await prisma.teachingAssignment.upsert({
    where: {
      teacherId_subjectId_schoolClassId_academicYearId: {
        teacherId: teacherProfile.id,
        subjectId: physics.id,
        schoolClassId: class6B.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      teacherId: teacherProfile.id,
      subjectId: physics.id,
      schoolClassId: class6B.id,
      academicYearId: academicYear.id,
    },
  });

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
