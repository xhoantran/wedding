"use client";

import { useState, useRef, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  fetchTableData,
  fetchAllCounts,
  fetchGuestList,
  saveGuestNote,
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

function GuestTable({ rows }: { rows: GuestRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-stone-400">No guests</p>
    );
  }

  const accepted = rows.filter((r) => r.rsvpStatus === "accept");
  const declined = rows.filter((r) => r.rsvpStatus === "decline");
  const totalAttending = accepted.reduce((s, r) => s + r.rsvpGuests, 0);

  return (
    <>
      <div className="mb-6 flex gap-6 text-sm text-stone-600">
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
      </div>
      <div className="overflow-x-auto rounded border border-stone-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              {["Name", "Title", "Photos", "RSVP", "Guests", "Meal", "Message", "Note", "Date"].map(
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
                <td className="whitespace-nowrap px-4 py-2.5 text-stone-500">
                  {row.vnTitle || "-"}
                </td>
                <td className="px-4 py-2.5 text-stone-500">{row.photos}</td>
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
          <GuestTable rows={guestRows} />
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
