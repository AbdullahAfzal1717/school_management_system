"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import InputField from "../InputField";
import {
  createMessage,
  getMessageFormOptions,
  updateMessage,
} from "@/app/actions/message";

const schema = z.object({
  receiverId: z.string().min(1, { message: "Recipient is required" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  body: z.string().min(1, { message: "Message is required" }),
});

type Inputs = z.infer<typeof schema>;

type Option = { id: string; name: string };

const MessageForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [users, setUsers] = useState<Option[]>([]);
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

    getMessageFormOptions()
      .then((options) => {
        if (isMounted) {
          setUsers(options.users);
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
        ? await createMessage(formData)
        : await updateMessage({ ...formData, id: data?.id ?? "" });

    if ("error" in result && result.error) {
      setServerError(result.error);
      return;
    }

    onSuccess?.();
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "New message" : "Edit message"}
      </h1>
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-xs text-gray-500">Recipient</label>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("receiverId")}
              defaultValue={data?.receiverId ?? ""}
            >
              <option value="">Select a person</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
          {errors.receiverId?.message && (
            <p className="text-xs text-red-400">{errors.receiverId.message}</p>
          )}
        </div>
        <InputField
          label="Subject"
          name="subject"
          defaultValue={data?.subject}
          register={register}
          error={errors?.subject}
        />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Message</label>
          <textarea
            {...register("body")}
            defaultValue={data?.body}
            rows={5}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          />
          {errors.body?.message && (
            <p className="text-xs text-red-400">{errors.body.message}</p>
          )}
        </div>
      </div>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <button type="submit" className="btn bg-blue-400 text-white p-2">
        {type === "create" ? "Send" : "Update"}
      </button>
    </form>
  );
};

export default MessageForm;
