"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import InputField from "../InputField";
import {
  createAttendance,
  getAttendanceFormOptions,
  updateAttendance,
} from "@/app/actions/attendance";

const statuses = ["PRESENT", "ABSENT", "LATE"] as const;

const schema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  status: z.enum(statuses, { message: "Status is required" }),
  studentId: z.string().min(1, { message: "Student is required" }),
  classId: z.string().min(1, { message: "Class is required" }),
});

type Inputs = z.infer<typeof schema>;

type Option = { id: string; name: string };

const AttendenceForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [students, setStudents] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
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

    getAttendanceFormOptions()
      .then((options) => {
        if (isMounted) {
          setStudents(options.students);
          setClasses(options.classes);
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
        ? await createAttendance(formData)
        : await updateAttendance({ ...formData, id: data?.id ?? "" });

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    onSuccess?.();
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className=" text-xl font-semibold">
        {type === "create" ? "Create a new Attendance" : "Edit Attendance"}
      </h1>
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Student</label>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("studentId")}
              defaultValue={data?.studentId ?? ""}
            >
              <option value="" disabled>
                Select a student
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          )}
          {errors.studentId?.message && (
            <p className="text-xs text-red-400">
              {errors.studentId.message.toString()}
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
        <InputField
          label="Date"
          name="date"
          type="date"
          defaultValue={data?.date}
          register={register}
          error={errors?.date}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Status</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("status")}
            defaultValue={data?.status ?? "PRESENT"}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">
              {errors.status.message.toString()}
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

export default AttendenceForm;
