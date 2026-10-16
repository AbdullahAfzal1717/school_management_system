"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import InputField from "../InputField";
import {
  createParent,
  getParentFormOptions,
  updateParent,
} from "@/app/actions/parent";

const schema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: "Password should be atleast 8 characters long",
    }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

type Inputs = z.infer<typeof schema>;

type StudentOption = { id: string; name: string; studentNumber: string };

const ParentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    let isMounted = true;

    getParentFormOptions()
      .then((options) => {
        if (isMounted) {
          setStudents(options.students);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingStudents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = handleSubmit(async (formData) => {
    setServerError(null);
    const studentIds = formData.studentIds ?? [];
    const payload =
      type === "create"
        ? {
            ...formData,
            studentIds,
            password: formData.password ?? "",
          }
        : {
            ...formData,
            studentIds,
            password: formData.password || undefined,
            id: data?.id ?? "",
          };
    const result =
      type === "create"
        ? await createParent(payload as any)
        : await updateParent(payload as any);

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    onSuccess?.();
  });

  const selectedStudentIds: string[] = data?.studentIds ?? [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className=" text-xl font-semibold">
        {type === "create" ? "Create a new Parent" : "Edit Parent"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between gap-4 flex-wrap">
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label={
            type === "edit" ? "Password (leave blank to keep)" : "Password"
          }
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <div className="flex justify-between gap-4 flex-wrap">
        <InputField
          label="FirstName"
          name="firstName"
          defaultValue={data?.firstName}
          register={register}
          error={errors?.firstName}
        />
        <InputField
          label="LastName"
          name="lastName"
          defaultValue={data?.lastName}
          register={register}
          error={errors?.lastName}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors?.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors?.address}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Linked Students
      </span>
      <div className="flex flex-wrap gap-4">
        {isLoadingStudents ? (
          <p className="text-sm text-gray-400">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-gray-400">No students available yet.</p>
        ) : (
          students.map((student) => (
            <label
              key={student.id}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <input
                type="checkbox"
                value={student.id}
                defaultChecked={selectedStudentIds.includes(student.id)}
                {...register("studentIds")}
              />
              <span>
                {student.name}{" "}
                <span className="text-gray-400">({student.studentNumber})</span>
              </span>
            </label>
          ))
        )}
      </div>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ParentForm;
