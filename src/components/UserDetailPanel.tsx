"use client";

import { FormEvent, useState } from "react";
import { Save, Trash2 } from "lucide-react";

type UserDetail = {
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
  createdAt: string;
  updatedAt: string;
  projectCount: number;
  activityCount: number;
};

type UserActivity = {
  id: number;
  action: string;
  targetType: string | null;
  targetId: number | null;
  description: string | null;
  createdAt: string;
  project: {
    id: number;
    name: string;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function UserDetailPanel({
  initialUser,
  activities,
  currentUserId,
}: {
  initialUser: UserDetail;
  activities: UserActivity[];
  currentUserId: number;
}) {
  const [user, setUser] = useState(initialUser);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canDelete = user.id !== currentUserId;

  async function updateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/users/${user.id}`, {
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
    setLoading(false);
    setMessage(data?.message ?? "User diproses.");

    if (response.ok) {
      setUser((current) => ({
        ...current,
        ...data.user,
        createdAt: current.createdAt,
        updatedAt: data.user.updatedAt ?? current.updatedAt,
      }));
    }
  }

  async function deleteUser() {
    if (loading || !canDelete) return;

    setLoading(true);
    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    setLoading(false);
    setMessage(data?.message ?? "User diproses.");

    if (response.ok) {
      window.location.href = "/settings";
    }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="brutal-card bg-earth-light p-5">
        <div className="flex items-center gap-4 border-b-2 border-earth-dark pb-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden border-2 border-earth-dark bg-moss-light font-display text-3xl font-black">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="label-mono text-moss">User Detail</p>
            <h2 className="font-display mt-1 truncate text-3xl font-black">{user.name}</h2>
            <p className="mt-1 truncate text-sm text-earth-dark/65">{user.email}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="border-2 border-earth-dark bg-earth-paper p-4">
            <p className="label-mono text-earth-dark/55">Role</p>
            <p className="mt-2 text-lg font-black uppercase">{user.role}</p>
          </div>
          <div className="border-2 border-earth-dark bg-earth-paper p-4">
            <p className="label-mono text-earth-dark/55">Project</p>
            <p className="font-display mt-2 text-3xl font-black">{user.projectCount}</p>
          </div>
          <div className="border-2 border-earth-dark bg-earth-paper p-4">
            <p className="label-mono text-earth-dark/55">Activity</p>
            <p className="font-display mt-2 text-3xl font-black">{user.activityCount}</p>
          </div>
        </div>

        {message ? <p className="mt-5 border-2 border-moss bg-moss-light px-4 py-3 text-sm font-bold text-moss">{message}</p> : null}

        <form onSubmit={updateUser} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label-mono">Nama</span>
              <input name="name" required defaultValue={user.name} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
            </label>
            <label className="block">
              <span className="label-mono">Email</span>
              <input name="email" required type="email" defaultValue={user.email} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
            </label>
            <label className="block">
              <span className="label-mono">Role</span>
              <select name="role" defaultValue={user.role} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="block">
              <span className="label-mono">Password Baru</span>
              <input name="password" type="password" minLength={6} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" placeholder="Kosongkan jika tidak diganti" />
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

          <div className="mt-6 flex flex-col justify-between gap-3 border-t-2 border-earth-dark pt-5 md:flex-row md:items-center">
            <button className="brutal-button border-hazard bg-earth-light px-4 py-3 text-hazard disabled:opacity-45" disabled={loading || !canDelete} onClick={deleteUser} type="button">
              <Trash2 size={17} /> Hapus User
            </button>
            <button className="brutal-button bg-earth-dark px-5 py-3 text-earth-light" disabled={loading} type="submit">
              <Save size={17} /> {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </section>

      <section className="brutal-card bg-earth-light p-5">
        <div className="border-b-2 border-earth-dark pb-5">
          <p className="label-mono text-moss">Audit Trail</p>
          <h2 className="font-display mt-1 text-3xl font-black">Activity User</h2>
          <p className="mt-2 text-sm leading-6 text-earth-dark/65">Aktivitas terakhir yang tercatat dari project, objek peta, dan import project.</p>
        </div>

        <div className="mt-5 space-y-3">
          {activities.map((activity) => (
            <article key={activity.id} className="border-2 border-earth-dark bg-earth-paper p-4">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                <div>
                  <p className="font-bold">{activity.description || activity.action}</p>
                  <p className="mt-1 text-sm text-earth-dark/65">{activity.project.name}</p>
                </div>
                <span className="label-mono shrink-0 text-earth-dark/55">{formatDate(activity.createdAt)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase">
                <span className="border border-earth-dark px-2 py-1">{activity.action}</span>
                {activity.targetType ? <span className="border border-earth-dark px-2 py-1">{activity.targetType}</span> : null}
                {activity.targetId ? <span className="border border-earth-dark px-2 py-1">ID {activity.targetId}</span> : null}
              </div>
            </article>
          ))}

          {!activities.length ? (
            <div className="border-2 border-earth-dark bg-earth-paper p-6 text-sm text-earth-dark/65">Belum ada activity log untuk user ini.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
