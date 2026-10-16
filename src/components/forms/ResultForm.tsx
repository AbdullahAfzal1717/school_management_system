"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import InputField from "../InputField";
import {
  createResult,
  getResultFormOptions,
  updateResult,
} from "@/app/actions/result";

const schema = z.object({
  examId: z.string().min(1, { message: "Exam is required" }),
  studentId: z.string().min(1, { message: "Student is required" }),
  score: z.coerce
    .number({ message: "Score is required" })
    .int()
    .min(0, { message: "Score must be between 0 and 100" })
    .max(100, { message: "Score must be between 0 and 100" }),
});

type Inputs = z.infer<typeof schema>;

type Option = { id: string; name: string };

const ResultForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [exams, setExams] = useState<Option[]>([]);
  const [students, setStudents] = useState<Option[]>([]);
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

    getResultFormOptions()
      .then((options) => {
        if (isMounted) {
          setExams(options.exams);
          setStudents(options.students);
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
        ? await createResult(formData)
        : await updateResult({ ...formData, id: data?.id ?? "" });

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    onSuccess?.();
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className=" text-xl font-semibold">
        {type === "create" ? "Create a new Result" : "Edit Result"}
      </h1>
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Exam</label>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("examId")}
              defaultValue={data?.examId ?? ""}
            >
              <option value="" disabled>
                Select an exam
              </option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          )}
          {errors.examId?.message && (
            <p className="text-xs text-red-400">
              {errors.examId.message.toString()}
            </p>
          )}
        </div>
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
        <InputField
          label="Score"
          name="score"
          type="number"
          defaultValue={data?.score}
          register={register}
          error={errors?.score}
        />
      </div>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ResultForm;
