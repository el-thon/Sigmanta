"use client";

import { FormEvent, useState } from "react";
import { Plus, Save, Trash2, UserRound, X } from "lucide-react";

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

type ModalState =
  | { mode: "create"; user?: never }
  | { mode: "edit"; user: ManagedUser }
  | null;

function emptyUser(): ManagedUser {
  return {
    id: 0,
    name: "",
    email: "",
    role: "user",
    phone: null,
    address: null,
    institution: null,
    occupation: null,
    age: null,
    bio: null,
    avatarUrl: null,
  };
}

export function ManageUsersPanel({ initialUsers, currentUserId }: { initialUsers: ManagedUser[]; currentUserId: number }) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [loading, setLoading] = useState(false);

  const activeUser = modal?.mode === "edit" ? modal.user : emptyUser();
  const isCreate = modal?.mode === "create";

  async function createUser(form: FormData) {
    const response = await fetch("/api/users", {
      method: "POST",
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
      setUsers((current) => [data.user, ...current]);
      setModal(null);
    }
  }

  async function updateUser(form: FormData, userId: number) {
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
      setUsers((current) => current.map((item) => (item.id === userId ? data.user : item)));
      setModal({ mode: "edit", user: data.user });
    }
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || loading) return;

    setLoading(true);
    const form = new FormData(event.currentTarget);
    if (modal.mode === "create") {
      await createUser(form);
    } else {
      await updateUser(form, modal.user.id);
    }
    setLoading(false);
  }

  async function deleteUser(userId: number) {
    if (loading || userId === currentUserId) return;

    setLoading(true);
    const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    setLoading(false);
    setMessage(data?.message ?? "User diproses.");
    if (response.ok) {
      setUsers((current) => current.filter((item) => item.id !== userId));
      setModal(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="label-mono text-earth-dark/55">Total User</p>
          <p className="font-display mt-1 text-3xl font-black">{users.length} Akun</p>
        </div>
        <button className="brutal-button bg-earth-dark px-5 py-4 text-earth-light" onClick={() => setModal({ mode: "create" })} type="button">
          <Plus size={18} /> Tambah User
        </button>
      </div>

      {message ? <p className="brutal-card mt-5 bg-moss-light px-4 py-3 text-sm font-bold text-moss">{message}</p> : null}

      <section className="brutal-card mt-6 overflow-hidden bg-earth-light">
        <div className="grid border-b-2 border-earth-dark bg-earth-dark px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-earth-light md:grid-cols-[1.1fr_1.2fr_120px_1fr_110px]">
          <span>Nama</span>
          <span>Email</span>
          <span>Role</span>
          <span>Instansi</span>
          <span>Aksi</span>
        </div>

        {users.map((user) => (
          <button
            key={user.id}
            className="grid w-full gap-2 border-b border-earth-dark/15 px-5 py-4 text-left text-sm transition hover:bg-moss-light md:grid-cols-[1.1fr_1.2fr_120px_1fr_110px] md:items-center"
            onClick={() => setModal({ mode: "edit", user })}
            type="button"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden border-2 border-earth-dark bg-earth-paper font-display text-lg font-black">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="font-bold">{user.name}</span>
            </span>
            <span className="text-earth-dark/65">{user.email}</span>
            <span className="w-fit border border-earth-dark px-2 py-1 text-xs font-bold uppercase">{user.role}</span>
            <span className="text-earth-dark/65">{user.institution || "-"}</span>
            <span className="label-mono text-moss">Detail</span>
          </button>
        ))}

        {!users.length ? (
          <div className="px-5 py-8 text-sm text-earth-dark/65">Belum ada user.</div>
        ) : null}
      </section>

      {modal ? (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-earth-dark/55 px-4 py-6">
          <div className="mx-auto brutal-card w-full max-w-4xl bg-earth-light">
            <div className="flex items-center justify-between border-b-2 border-earth-dark px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center border-2 border-earth-dark bg-moss-light">
                  <UserRound size={21} />
                </span>
                <div>
                  <p className="label-mono text-moss">{isCreate ? "Create User" : "User Detail"}</p>
                  <h2 className="font-display mt-1 text-2xl font-black">{isCreate ? "Tambah User" : activeUser.name}</h2>
                </div>
              </div>
              <button aria-label="Tutup form user" onClick={() => setModal(null)} type="button">
                <X />
              </button>
            </div>

            <form onSubmit={submitUser} className="p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="label-mono">Nama</span>
                  <input name="name" required defaultValue={activeUser.name} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
                </label>
                <label className="block">
                  <span className="label-mono">Email</span>
                  <input name="email" required type="email" defaultValue={activeUser.email} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
                </label>
                <label className="block">
                  <span className="label-mono">Role</span>
                  <select name="role" defaultValue={activeUser.role} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="block">
                  <span className="label-mono">{isCreate ? "Password Awal" : "Password Baru"}</span>
                  <input
                    name="password"
                    type="password"
                    required={isCreate}
                    minLength={6}
                    className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none"
                    placeholder={isCreate ? "Minimal 6 karakter" : "Kosongkan jika tidak diganti"}
                  />
                </label>
                <label className="block">
                  <span className="label-mono">No. Telepon</span>
                  <input name="phone" defaultValue={activeUser.phone ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
                </label>
                <label className="block">
                  <span className="label-mono">Umur</span>
                  <input name="age" type="number" min={10} max={120} defaultValue={activeUser.age ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
                </label>
                <label className="block">
                  <span className="label-mono">Instansi</span>
                  <input name="institution" defaultValue={activeUser.institution ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
                </label>
                <label className="block">
                  <span className="label-mono">Pekerjaan/Jabatan</span>
                  <input name="occupation" defaultValue={activeUser.occupation ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
                </label>
                <label className="block md:col-span-2">
                  <span className="label-mono">Alamat</span>
                  <textarea name="address" defaultValue={activeUser.address ?? ""} className="mt-2 min-h-24 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
                </label>
                <label className="block md:col-span-2">
                  <span className="label-mono">Bio</span>
                  <textarea name="bio" defaultValue={activeUser.bio ?? ""} className="mt-2 min-h-24 w-full border-2 border-earth-dark bg-earth-light px-4 py-3 outline-none" />
                </label>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-3 border-t-2 border-earth-dark pt-5 md:flex-row md:items-center">
                {!isCreate ? (
                  <button
                    className="brutal-button border-hazard bg-earth-light px-4 py-3 text-hazard disabled:opacity-45"
                    disabled={loading || activeUser.id === currentUserId}
                    onClick={() => deleteUser(activeUser.id)}
                    type="button"
                  >
                    <Trash2 size={17} /> Hapus User
                  </button>
                ) : <span />}
                <div className="flex gap-3">
                  <button className="brutal-button bg-earth-light px-4 py-3" onClick={() => setModal(null)} type="button">
                    Batal
                  </button>
                  <button className="brutal-button bg-earth-dark px-5 py-3 text-earth-light" disabled={loading} type="submit">
                    <Save size={17} /> {loading ? "Menyimpan..." : isCreate ? "Buat User" : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
