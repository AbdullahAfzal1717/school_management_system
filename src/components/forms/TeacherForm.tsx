"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import InputField from "../InputField";
import { createTeacher, updateTeacher } from "@/app/actions/teacher";

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
  employeeId: z.string().min(1, { message: "Employee ID is required" }),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const TeacherForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (formData) => {
    setServerError(null);
    const payload =
      type === "create"
        ? { ...formData, password: formData.password ?? "" }
        : {
            ...formData,
            password: formData.password || undefined,
            id: data?.id ?? "",
          };
    const result =
      type === "create"
        ? await createTeacher(payload as any)
        : await updateTeacher(payload as any);

    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    onSuccess?.();
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className=" text-xl font-semibold">
        {type === "create" ? "Create a new Teacher" : "Edit Teacher"}
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
          label="Employee ID"
          name="employeeId"
          defaultValue={data?.employeeId}
          register={register}
          error={errors?.employeeId}
        />
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
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default TeacherForm;
