"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import InputField from "../InputField";
import {
  createAssignment,
  getAssignmentFormOptions,
  updateAssignment,
} from "@/app/actions/assignment";

const schema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  dueDate: z.string().min(1, { message: "Due date is required" }),
  subjectId: z.string().min(1, { message: "Subject is required" }),
  classId: z.string().min(1, { message: "Class is required" }),
  teacherId: z.string().min(1, { message: "Teacher is required" }),
});

type Inputs = z.infer<typeof schema>;

type Option = { id: string; name: string };

const AssignmentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    let isMounted = true;

    getAssignmentFormOptions()
      .then((options) => {
        if (isMounted) {
          setSubjects(options.subjects);
          setClasses(options.classes);
          setTeachers(options.teachers);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = handleSubmit(async (formData) => {
    setServerError(null);
    const result =
      type === "create"
        ? await createAssignment(formData)
        : await updateAssignment({ ...formData, id: data?.id ?? "" });

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    onSuccess?.();
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className=" text-xl font-semibold">
        {type === "create" ? "Create a new Assignment" : "Edit Assignment"}
      </h1>
      <div className="flex justify-between gap-4 flex-wrap">
        <InputField
          label="Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Start Date"
          name="startDate"
          type="date"
          defaultValue={data?.startDate}
          register={register}
          error={errors?.startDate}
        />
        <InputField
          label="Due Date"
          name="dueDate"
          type="date"
          defaultValue={data?.dueDate}
          register={register}
          error={errors?.dueDate}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subject</label>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("subjectId")}
              defaultValue={data?.subjectId ?? ""}
            >
              <option value="" disabled>
                Select a subject
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          )}
          {errors.subjectId?.message && (
            <p className="text-xs text-red-400">
              {errors.subjectId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("classId")}
              defaultValue={data?.classId ?? ""}
            >
              <option value="" disabled>
                Select a class
              </option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          )}
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Teacher</label>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("teacherId")}
              defaultValue={data?.teacherId ?? ""}
            >
              <option value="" disabled>
                Select a teacher
              </option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          )}
          {errors.teacherId?.message && (
            <p className="text-xs text-red-400">
              {errors.teacherId.message.toString()}
            </p>
          )}
        </div>
      </div>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AssignmentForm;
