"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";

type ProfileUser = {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  institution: string | null;
  occupation: string | null;
  age: number | null;
  bio: string | null;
  avatarUrl: string | null;
};

export function ProfileForm({ user }: { user: ProfileUser }) {
  const [message, setMessage] = useState("");

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/profile", {
      method: "PUT",
      body: new FormData(event.currentTarget),
    });
    const data = await response.json().catch(() => null);
    setMessage(data?.message ?? "Profil diproses.");
  }

  return (
    <form onSubmit={submitProfile} className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
      <section className="brutal-card bg-earth-light p-6">
        <div className="mx-auto grid h-36 w-36 place-items-center overflow-hidden border-2 border-earth-dark bg-earth-paper font-display text-5xl font-black shadow-[4px_4px_0_#1c1a14]">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1)}
        </div>
        <label className="mt-6 block">
          <span className="label-mono">Foto Profil</span>
          <input name="avatar" type="file" accept="image/*" className="brutal-card mt-2 w-full bg-earth-light px-4 py-3 text-sm outline-none file:mr-3 file:border-0 file:bg-earth-dark file:px-3 file:py-2 file:text-earth-light" />
        </label>
        {message ? <p className="mt-4 border-2 border-moss bg-moss-light px-3 py-2 text-sm font-bold text-moss">{message}</p> : null}
      </section>

      <section className="brutal-card bg-earth-light p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="label-mono">Nama</span>
            <input name="name" required defaultValue={user.name} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
          </label>
          <label className="block">
            <span className="label-mono">Email</span>
            <input name="email" required type="email" defaultValue={user.email} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
          </label>
          <label className="block">
            <span className="label-mono">No. Telepon</span>
            <input name="phone" defaultValue={user.phone ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
          </label>
          <label className="block">
            <span className="label-mono">Umur</span>
            <input name="age" type="number" min={10} max={120} defaultValue={user.age ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
          </label>
          <label className="block">
            <span className="label-mono">Instansi</span>
            <input name="institution" defaultValue={user.institution ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
          </label>
          <label className="block">
            <span className="label-mono">Pekerjaan/Jabatan</span>
            <input name="occupation" defaultValue={user.occupation ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
          </label>
          <label className="block md:col-span-2">
            <span className="label-mono">Alamat</span>
            <textarea name="address" defaultValue={user.address ?? ""} className="mt-2 min-h-24 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
          </label>
          <label className="block md:col-span-2">
            <span className="label-mono">Bio</span>
            <textarea name="bio" defaultValue={user.bio ?? ""} className="mt-2 min-h-24 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
          </label>
        </div>
        <button className="brutal-button mt-6 bg-earth-dark px-5 py-4 text-earth-light" type="submit">
          <Save size={17} /> Simpan Profil
        </button>
      </section>
    </form>
  );
}
