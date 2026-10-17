"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { changePassword, updateProfile } from "@/app/actions/account";

type SettingsUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  address: string;
};

const SettingsForms = ({ user }: { user: SettingsUser }) => {
  const router = useRouter();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const hasContact = user.role !== "ADMIN";

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    const formData = new FormData(event.currentTarget);
    const result = await updateProfile({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
    });

    if ("error" in result && result.error) {
      setProfileError(result.error);
      return;
    }

    setProfileSuccess(true);
    router.refresh();
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = await changePassword({
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
    });

    if ("error" in result && result.error) {
      setPasswordError(result.error);
      return;
    }

    setPasswordSuccess(true);
    form.reset();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="min-w-0 rounded-md bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 break-all text-sm text-gray-500">{user.email}</p>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          First name
          <input
            name="firstName"
            defaultValue={user.firstName}
            required
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          Last name
          <input
            name="lastName"
            defaultValue={user.lastName}
            required
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </label>
        {hasContact && (
          <>
            <label className="mt-4 flex flex-col gap-2 text-sm">
              Phone
              <input
                name="phone"
                defaultValue={user.phone}
                className="w-full rounded-md border border-gray-300 p-2"
              />
            </label>
            <label className="mt-4 flex flex-col gap-2 text-sm">
              Address
              <input
                name="address"
                defaultValue={user.address}
                className="w-full rounded-md border border-gray-300 p-2"
              />
            </label>
          </>
        )}
        {profileError && <p className="mt-3 text-sm text-red-500">{profileError}</p>}
        {profileSuccess && (
          <p className="mt-3 text-sm text-green-600">Profile saved.</p>
        )}
        <button type="submit" className="btn mt-4 bg-sky-500 px-4 py-2 text-white">
          Save profile
        </button>
      </form>
      <form onSubmit={savePassword} className="min-w-0 rounded-md bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Change password</h2>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          Current password
          <input
            name="currentPassword"
            type="password"
            required
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          New password
          <input
            name="newPassword"
            type="password"
            minLength={8}
            required
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </label>
        {passwordError && (
          <p className="mt-3 text-sm text-red-500">{passwordError}</p>
        )}
        {passwordSuccess && (
          <p className="mt-3 text-sm text-green-600">Password updated.</p>
        )}
        <button type="submit" className="btn mt-4 bg-sky-500 px-4 py-2 text-white">
          Update password
        </button>
      </form>
    </div>
  );
};

export default SettingsForms;
