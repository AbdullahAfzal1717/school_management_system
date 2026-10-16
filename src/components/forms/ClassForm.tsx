"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import InputField from "../InputField";
import {
  createClass,
  getClassFormOptions,
  updateClass,
} from "@/app/actions/class";

const schema = z.object({
  name: z.string().min(1, { message: "Class name is required" }),
  grade: z.coerce
    .number({ message: "Grade is required" })
    .int()
    .min(1, { message: "Grade must be at least 1" }),
  capacity: z.coerce
    .number({ message: "Capacity is required" })
    .int()
    .min(1, { message: "Capacity must be at least 1" }),
  academicYearId: z.string().min(1, { message: "Academic year is required" }),
  supervisorId: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

type YearOption = { id: string; name: string; isCurrent: boolean };
type TeacherOption = { id: string; name: string };

const ClassForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<YearOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
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

    getClassFormOptions()
      .then((options) => {
        if (isMounted) {
          setAcademicYears(options.academicYears);
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

  const currentYearId =
    academicYears.find((year) => year.isCurrent)?.id ??
    academicYears[0]?.id ??
    "";

  const onSubmit = handleSubmit(async (formData) => {
    setServerError(null);
    const result =
      type === "create"
        ? await createClass(formData)
        : await updateClass({ ...formData, id: data?.id ?? "" });

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    onSuccess?.();
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className=" text-xl font-semibold">
        {type === "create" ? "Create a new Class" : "Edit Class"}
      </h1>
      <div className="flex justify-between gap-4 flex-wrap">
        <InputField
          label="Class Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Grade"
          name="grade"
          type="number"
          defaultValue={data?.grade}
          register={register}
          error={errors?.grade}
        />
        <InputField
          label="Capacity"
          name="capacity"
          type="number"
          defaultValue={data?.capacity}
          register={register}
          error={errors?.capacity}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Academic Year</label>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("academicYearId")}
              defaultValue={data?.academicYearId ?? currentYearId}
            >
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                  {year.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
          )}
          {errors.academicYearId?.message && (
            <p className="text-xs text-red-400">
              {errors.academicYearId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Supervisor</label>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("supervisorId")}
              defaultValue={data?.supervisorId ?? ""}
            >
              <option value="">No supervisor</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
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

export default ClassForm;
