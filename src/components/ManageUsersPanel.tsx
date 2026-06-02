"use client";

import { FormEvent, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  phone: string | null;
  address: string | null;
  institution: string | null;
  occupation: string | null;
  age: number | null;
  bio: string | null;
  avatarUrl: string | null;
};

export function ManageUsersPanel({ initialUsers, currentUserId }: { initialUsers: ManagedUser[]; currentUserId: number }) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role: String(form.get("role") ?? "user"),
        phone: String(form.get("phone") ?? ""),
        institution: String(form.get("institution") ?? ""),
        age: form.get("age") ? Number(form.get("age")) : null,
      }),
    });
    const data = await response.json().catch(() => null);
    setMessage(data?.message ?? "User diproses.");
    if (response.ok) {
      setUsers((current) => [data.user, ...current]);
      event.currentTarget.reset();
    }
  }

  async function updateUser(event: FormEvent<HTMLFormElement>, userId: number) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role: String(form.get("role") ?? "user"),
        phone: String(form.get("phone") ?? ""),
        address: String(form.get("address") ?? ""),
        institution: String(form.get("institution") ?? ""),
        occupation: String(form.get("occupation") ?? ""),
        age: form.get("age") ? Number(form.get("age")) : null,
        bio: String(form.get("bio") ?? ""),
      }),
    });
    const data = await response.json().catch(() => null);
    setMessage(data?.message ?? "User diproses.");
    if (response.ok) {
      setUsers((current) => current.map((item) => item.id === userId ? data.user : item));
    }
  }

  async function deleteUser(userId: number) {
    const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    setMessage(data?.message ?? "User diproses.");
    if (response.ok) setUsers((current) => current.filter((item) => item.id !== userId));
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
      <form onSubmit={createUser} className="brutal-card bg-earth-light p-6">
        <p className="label-mono text-moss">Create User</p>
        <h2 className="font-display mt-2 text-2xl font-black">Tambah Akun</h2>
        <div className="mt-5 space-y-4">
          <input name="name" required className="w-full border-2 border-earth-dark bg-earth-light px-3 py-3 outline-none" placeholder="Nama" />
          <input name="email" type="email" required className="w-full border-2 border-earth-dark bg-earth-light px-3 py-3 outline-none" placeholder="Email" />
          <input name="password" type="password" required minLength={6} className="w-full border-2 border-earth-dark bg-earth-light px-3 py-3 outline-none" placeholder="Password awal" />
          <input name="phone" className="w-full border-2 border-earth-dark bg-earth-light px-3 py-3 outline-none" placeholder="No. telepon" />
          <input name="institution" className="w-full border-2 border-earth-dark bg-earth-light px-3 py-3 outline-none" placeholder="Instansi" />
          <input name="age" type="number" min={10} max={120} className="w-full border-2 border-earth-dark bg-earth-light px-3 py-3 outline-none" placeholder="Umur" />
          <select name="role" className="w-full border-2 border-earth-dark bg-earth-light px-3 py-3 outline-none" defaultValue="user">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button className="brutal-button w-full bg-earth-dark px-4 py-3 text-earth-light" type="submit">
            <Plus size={17} /> Buat User
          </button>
        </div>
      </form>

      <section className="space-y-5">
        {message ? <p className="brutal-card bg-moss-light px-4 py-3 text-sm font-bold text-moss">{message}</p> : null}
        {users.map((user) => (
          <form key={user.id} onSubmit={(event) => updateUser(event, user.id)} className="brutal-card bg-earth-light p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center overflow-hidden border-2 border-earth-dark bg-earth-paper font-display text-xl font-black">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1)}
                </div>
                <div>
                  <p className="font-display text-2xl font-black">{user.name}</p>
                  <p className="text-sm text-earth-dark/60">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="brutal-button bg-earth-light px-3 py-2 text-xs" type="submit"><Save size={15} /> Save</button>
                <button
                  className="brutal-button border-hazard bg-earth-light px-3 py-2 text-xs text-hazard disabled:opacity-40"
                  type="button"
                  disabled={user.id === currentUserId}
                  onClick={() => deleteUser(user.id)}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input name="name" defaultValue={user.name} className="border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" />
              <input name="email" type="email" defaultValue={user.email} className="border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" />
              <select name="role" defaultValue={user.role} className="border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <input name="phone" defaultValue={user.phone ?? ""} className="border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" placeholder="No. telepon" />
              <input name="institution" defaultValue={user.institution ?? ""} className="border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" placeholder="Instansi" />
              <input name="occupation" defaultValue={user.occupation ?? ""} className="border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" placeholder="Pekerjaan" />
              <input name="age" type="number" min={10} max={120} defaultValue={user.age ?? ""} className="border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" placeholder="Umur" />
              <input name="password" type="password" className="border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none md:col-span-2" placeholder="Password baru opsional" />
              <textarea name="address" defaultValue={user.address ?? ""} className="min-h-20 border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none md:col-span-3" placeholder="Alamat" />
              <textarea name="bio" defaultValue={user.bio ?? ""} className="min-h-20 border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none md:col-span-3" placeholder="Bio" />
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
