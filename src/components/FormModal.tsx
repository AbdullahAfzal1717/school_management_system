"use client";

import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { deleteStudent } from "@/app/actions/student";
import { deleteTeacher } from "@/app/actions/teacher";
import { deleteParent } from "@/app/actions/parent";
import { deleteSubject } from "@/app/actions/subject";
import { deleteClass } from "@/app/actions/class";
import { deleteLesson } from "@/app/actions/lesson";
import { deleteExam } from "@/app/actions/exam";
import { deleteResult } from "@/app/actions/result";
import { deleteAssignment } from "@/app/actions/assignment";
import { deleteAttendance } from "@/app/actions/attendance";
import { deleteEvent } from "@/app/actions/event";
import { deleteAnnouncement } from "@/app/actions/announcement";
import { deleteMessage } from "@/app/actions/message";

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading....</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading....</h1>,
});
const ParentForm = dynamic(() => import("./forms/ParentForm"));
const SubjectForm = dynamic(() => import("./forms/SubjectForm"));
const ClassForm = dynamic(() => import("./forms/ClassForm"));
const LessonForm = dynamic(() => import("./forms/LessonForm"));
const ExamForm = dynamic(() => import("./forms/ExamForm"));
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"));
const ResultForm = dynamic(() => import("./forms/ResultForm"));
const AttendenceForm = dynamic(() => import("./forms/AttendenceForm"));
const EventForm = dynamic(() => import("./forms/EventForm"));
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"));
const MessageForm = dynamic(() => import("./forms/MessageForm"));

const forms: {
  [key: string]: (
    type: "create" | "edit",
    data?: any,
    onSuccess?: () => void,
  ) => JSX.Element;
} = {
  teacher: (type, data, onSuccess) => (
    <TeacherForm type={type} data={data} onSuccess={onSuccess} />
  ),
  student: (type, data, onSuccess) => (
    <StudentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  parent: (type, data, onSuccess) => (
    <ParentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  subject: (type, data, onSuccess) => (
    <SubjectForm type={type} data={data} onSuccess={onSuccess} />
  ),
  class: (type, data, onSuccess) => (
    <ClassForm type={type} data={data} onSuccess={onSuccess} />
  ),
  lesson: (type, data, onSuccess) => (
    <LessonForm type={type} data={data} onSuccess={onSuccess} />
  ),
  exam: (type, data, onSuccess) => (
    <ExamForm type={type} data={data} onSuccess={onSuccess} />
  ),
  assignment: (type, data, onSuccess) => (
    <AssignmentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  result: (type, data, onSuccess) => (
    <ResultForm type={type} data={data} onSuccess={onSuccess} />
  ),
  attendence: (type, data, onSuccess) => (
    <AttendenceForm type={type} data={data} onSuccess={onSuccess} />
  ),
  event: (type, data, onSuccess) => (
    <EventForm type={type} data={data} onSuccess={onSuccess} />
  ),
  announcement: (type, data, onSuccess) => (
    <AnnouncementForm type={type} data={data} onSuccess={onSuccess} />
  ),
  message: (type, data, onSuccess) => (
    <MessageForm type={type} data={data} onSuccess={onSuccess} />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
}: {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendence"
    | "event"
    | "announcement"
    | "message";

  type: "create" | "edit" | "delete";

  data?: any;
  id?: string | number;
}) => {
  const size = type === "create" ? "w-7 h-7" : "w-8 h-8";

  const bgColor =
    type === "create"
      ? "bg-AbYellow"
      : type === "edit"
        ? "bg-AbSky"
        : "bg-AbPurple";

  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    if (typeof id !== "string") {
      setServerError("Delete is not available for this resource yet.");
      return;
    }

    const result =
      table === "student"
        ? await deleteStudent(id)
        : table === "teacher"
          ? await deleteTeacher(id)
          : table === "parent"
            ? await deleteParent(id)
            : table === "subject"
              ? await deleteSubject(id)
              : table === "class"
                ? await deleteClass(id)
                : table === "lesson"
                  ? await deleteLesson(id)
                  : table === "exam"
                    ? await deleteExam(id)
                    : table === "result"
                      ? await deleteResult(id)
                      : table === "assignment"
                        ? await deleteAssignment(id)
                        : table === "attendence"
                          ? await deleteAttendance(id)
                          : table === "event"
                            ? await deleteEvent(id)
                            : table === "announcement"
                              ? await deleteAnnouncement(id)
                              : table === "message"
                                ? await deleteMessage(id)
                                : null;

    if (!result) {
      setServerError("Delete is not available for this resource yet.");
      return;
    }

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  };

  const Form = () => {
    return type === "delete" && id ? (
      <form onSubmit={handleDelete} className="p-4 flex flex-col gap-4">
        <span className="text-center font-medium">
          {" "}
          All data will be lost are you sure you want to delete this {table}?
        </span>
        {serverError && (
          <p className="text-center text-sm text-red-500">{serverError}</p>
        )}
        <button
          type="submit"
          className="btn bg-red-700 text-white py-2 px-4 w-max self-center"
        >
          Delete
        </button>
      </form>
    ) : type === "create" || type === "edit" ? (
      forms[table](type, data, () => setOpen(false))
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      <button
        type="button"
        className={`icon-btn ${size} ${bgColor}`}
        aria-label={
          type === "create"
            ? `Create ${table}`
            : type === "edit"
              ? `Edit ${table}`
              : `Delete ${table}`
        }
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
          <div className="relative my-4 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white p-4 sm:p-6">
            <Form />
            <button
              type="button"
              className="icon-btn absolute top-4 right-4 h-7 w-7"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
