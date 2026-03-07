"use client";

import { useState, useRef, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  fetchTableData,
  fetchAllCounts,
  fetchGuestList,
  saveGuestNote,
  createGuest,
  deleteGuest,
  updateGuestCeremony,
  GuestRow,
} from "./actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

const TABLES = [
  { key: "guests", label: "Guests" },
  { key: "guest_wishes", label: "Wishes" },
  { key: "poll_votes", label: "Poll Votes" },
  { key: "photos", label: "Photos" },
  { key: "song_requests", label: "Songs" },
] as const;

type TableKey = (typeof TABLES)[number]["key"];

function LoginForm({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        onAuth();
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-6 text-center text-lg font-semibold text-stone-800">
          Admin
        </h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoFocus
          className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-3 w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-500"
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 w-full rounded bg-stone-800 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {isPending ? "..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function GenericTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-stone-400">No data yet</p>
    );
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto rounded border border-stone-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500"
              >
                {col.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="max-w-75 truncate whitespace-nowrap px-4 py-2.5 text-stone-700"
                >
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  accept: "bg-green-100 text-green-700",
  decline: "bg-red-100 text-red-600",
  pending: "bg-stone-100 text-stone-400",
};

function NoteCell({ guestId, initial }: { guestId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setSaved(false);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(async () => {
      await saveGuestNote(guestId, newValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add note..."
        className="w-full min-w-35 border-b border-transparent bg-transparent px-1 py-1 text-sm text-stone-600 outline-none placeholder:text-stone-300 focus:border-stone-300"
      />
      {saved && (
        <span className="absolute -top-1 right-0 text-[10px] text-green-500">
          saved
        </span>
      )}
    </div>
  );
}

function AddGuestForm({ onCreated }: { onCreated: () => void }) {
  const [names, setNames] = useState("");
  const [vnTitle, setVnTitle] = useState("");
  const [message, setMessage] = useState("");
  const [ceremony, setCeremony] = useState(false);
  const [createdUrl, setCreatedUrl] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreatedUrl("");
    const nameList = names.split(",").map((n) => n.trim()).filter(Boolean);
    if (nameList.length === 0) {
      setError("At least one name is required");
      return;
    }
    startTransition(async () => {
      const result = await createGuest(nameList, vnTitle || undefined, message || undefined, ceremony);
      if ("error" in result) {
        setError(result.error);
      } else {
        const url = `${window.location.origin}/vi/invite/${result.id}`;
        setCreatedUrl(url);
        setNames("");
        setVnTitle("");
        setMessage("");
        setCeremony(false);
        onCreated();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-700">Add Guest (non-photo)</h3>
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={names}
          onChange={(e) => setNames(e.target.value)}
          placeholder="Names (comma-separated)"
          className="flex-1 min-w-48 rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-500"
        />
        <input
          type="text"
          value={vnTitle}
          onChange={(e) => setVnTitle(e.target.value)}
          placeholder="VN Title (optional)"
          className="w-32 rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-500"
        />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message (optional)"
          className="flex-1 min-w-48 rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-500"
        />
        <label className="flex items-center gap-1.5 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={ceremony}
            onChange={(e) => setCeremony(e.target.checked)}
            className="rounded border-stone-300"
          />
          Ceremony
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-stone-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {isPending ? "..." : "Add"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {createdUrl && (
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 rounded bg-stone-100 px-2 py-1 text-xs text-stone-600 select-all">
            {createdUrl}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(createdUrl)}
            className="rounded bg-stone-200 px-2 py-1 text-xs text-stone-600 hover:bg-stone-300"
          >
            Copy
          </button>
        </div>
      )}
    </form>
  );
}

function GuestTable({ rows, onRefresh }: { rows: GuestRow[]; onRefresh: () => void }) {
  const [deleting, setDeleting] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <>
        <AddGuestForm onCreated={onRefresh} />
        <p className="py-12 text-center text-sm text-stone-400">No guests</p>
      </>
    );
  }

  const accepted = rows.filter((r) => r.rsvpStatus === "accept");
  const declined = rows.filter((r) => r.rsvpStatus === "decline");
  const totalAttending = accepted.reduce((s, r) => s + r.rsvpGuests, 0);
  const photoGuests = rows.filter((r) => r.hasPhotos).length;
  const nonPhotoGuests = rows.length - photoGuests;

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this guest?")) return;
    setDeleting(id);
    const result = await deleteGuest(id);
    setDeleting(null);
    if (result.success) {
      onRefresh();
    } else {
      alert(result.error ?? "Failed to delete");
    }
  };

  const copyInviteUrl = (id: string) => {
    const url = `${window.location.origin}/vi/invite/${id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <>
      <AddGuestForm onCreated={onRefresh} />
      <div className="mb-6 flex flex-wrap gap-6 text-sm text-stone-600">
        <span>
          Accepted:{" "}
          <strong className="text-green-700">{accepted.length}</strong>
        </span>
        <span>
          Declined:{" "}
          <strong className="text-red-600">{declined.length}</strong>
        </span>
        <span>
          Pending:{" "}
          <strong className="text-stone-500">
            {rows.length - accepted.length - declined.length}
          </strong>
        </span>
        <span>
          Total attending:{" "}
          <strong className="text-stone-800">{totalAttending}</strong>
        </span>
        <span className="ml-auto text-xs text-stone-400">
          {photoGuests} photo · {nonPhotoGuests} non-photo
        </span>
      </div>
      <div className="overflow-x-auto rounded border border-stone-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              {["Name", "Type", "Title", "RSVP", "Guests", "Meal", "Message", "Note", "Date", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50"
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-medium text-stone-800">
                  {row.names}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        row.hasPhotos
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.hasPhotos ? `${row.photoCount} photos` : "invite"}
                    </span>
                    {row.ceremony && (
                      <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        ceremony
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-stone-500">
                  {row.vnTitle || "-"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.rsvpStatus] ?? STATUS_STYLES.pending}`}
                  >
                    {row.rsvpStatus}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-stone-500">
                  {row.rsvpGuests || "-"}
                </td>
                <td className="px-4 py-2.5 text-stone-500">
                  {row.rsvpMeal || "-"}
                </td>
                <td className="max-w-50 truncate px-4 py-2.5 text-stone-500">
                  {row.rsvpMessage || "-"}
                </td>
                <td className="px-4 py-2.5">
                  <NoteCell guestId={row.id} initial={row.note} />
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-stone-400">
                  {row.rsvpDate
                    ? new Date(row.rsvpDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyInviteUrl(row.id)}
                      title="Copy invite URL"
                      className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V9.5A1.5 1.5 0 0 1 12 11V8.621a3 3 0 0 0-.879-2.121L9 4.379A3 3 0 0 0 6.879 3.5H5.5Z" />
                        <path d="M4 5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 14h5a1.5 1.5 0 0 0 1.5-1.5V8.621a1.5 1.5 0 0 0-.44-1.06L7.94 5.439A1.5 1.5 0 0 0 6.878 5H4Z" />
                      </svg>
                    </button>
                    {!row.hasPhotos && (
                      <button
                        onClick={async () => {
                          const ok = await updateGuestCeremony(row.id, !row.ceremony);
                          if (ok) onRefresh();
                        }}
                        title={row.ceremony ? "Remove from ceremony" : "Add to ceremony"}
                        className={`rounded p-1 ${row.ceremony ? "text-purple-500 hover:bg-purple-50" : "text-stone-400 hover:bg-stone-100 hover:text-stone-600"}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <circle cx="5.5" cy="8" r="3.5" stroke="currentColor" strokeWidth="0.5" fill="none" />
                          <circle cx="10.5" cy="8" r="3.5" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        </svg>
                      </button>
                    )}
                    {!row.hasPhotos && (
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id}
                        title="Delete guest"
                        className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(value).toLocaleString();
  }
  return String(value);
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TableKey>("guests");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [guestRows, setGuestRows] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [countsLoaded, setCountsLoaded] = useState(false);

  if (!countsLoaded) {
    setCountsLoaded(true);
    fetchAllCounts().then(setCounts);
    fetchGuestList().then((data) => {
      setGuestRows(data);
      setLoading(false);
    });
  }

  const switchTab = (tab: TableKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setLoading(true);
    if (tab === "guests") {
      fetchGuestList().then((data) => {
        setGuestRows(data);
        setLoading(false);
      });
    } else {
      fetchTableData(tab).then((data) => {
        setRows(data as Record<string, unknown>[]);
        setLoading(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-stone-800">
            Wedding Admin
          </h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TABLES.map(({ key, label }) => (
            <div
              key={key}
              onClick={() => switchTab(key)}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                activeTab === key
                  ? "border-stone-400 bg-white shadow-sm"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <p className="text-2xl font-semibold text-stone-800">
                {counts[key] ?? "-"}
              </p>
              <p className="mt-1 text-xs text-stone-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex gap-1 border-b border-stone-200">
          {TABLES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-b-2 border-stone-800 text-stone-800"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-stone-400">
            Loading...
          </p>
        ) : activeTab === "guests" ? (
          <GuestTable rows={guestRows} onRefresh={() => {
            fetchGuestList().then(setGuestRows);
            fetchAllCounts().then(setCounts);
          }} />
        ) : (
          <GenericTable rows={rows} />
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => {
    if (typeof window === "undefined") return false;
    // Check if there's a session — will be validated on first server call
    return !!supabase.auth.getSession();
  });
  const [checked, setChecked] = useState(false);

  // Verify session on mount
  if (!checked) {
    setChecked(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
  }

  if (!checked) return null;
  if (!authed) return <LoginForm onAuth={() => setAuthed(true)} />;
  return <Dashboard />;
}
