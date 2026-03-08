"use client";

import { useState, useRef, useTransition, useMemo, Fragment } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  fetchTableData,
  fetchAllCounts,
  fetchGuestList,
  saveGuestNote,
  createGuest,
  deleteGuest,
  updateGuestCeremony,
  fetchInviteGroups,
  GuestRow,
  InviteGroupDisplay,
} from "./actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

const TABLES = [
  { key: "guests", label: "Guests" },
  { key: "groups", label: "Groups" },
  { key: "guest_wishes", label: "Wishes" },
  { key: "poll_votes", label: "Poll Votes" },
  { key: "photos", label: "Photos" },
  { key: "song_requests", label: "Songs" },
] as const;

type TableKey = (typeof TABLES)[number]["key"];
type SortKey = "names" | "rsvpStatus" | "isSeen" | "rsvpDate" | "ceremony";
type SortDir = "asc" | "desc";

/* ─── Login ─── */

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

/* ─── Generic table for non-guest tabs ─── */

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(value).toLocaleString();
  }
  return String(value);
}

function GenericTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-stone-400">No data yet</p>
    );
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500"
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
              className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="max-w-75 truncate whitespace-nowrap px-4 py-3 text-stone-700"
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

/* ─── Status badge ─── */

const STATUS_STYLES: Record<string, string> = {
  accept: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  decline: "bg-red-50 text-red-700 ring-red-600/20",
  pending: "bg-stone-100 text-stone-500 ring-stone-500/10",
};

/* ─── Inline note editor ─── */

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
        className="w-full min-w-32 border-b border-transparent bg-transparent px-1 py-1 text-sm text-stone-600 outline-none placeholder:text-stone-300 focus:border-stone-300"
      />
      {saved && (
        <span className="absolute -top-1 right-0 text-[10px] text-emerald-500">
          saved
        </span>
      )}
    </div>
  );
}

/* ─── Add Guest form ─── */

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
    const nameList = names
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (nameList.length === 0) {
      setError("At least one name is required");
      return;
    }
    startTransition(async () => {
      const result = await createGuest(
        nameList,
        vnTitle || undefined,
        message || undefined,
        ceremony
      );
      if ("error" in result) {
        setError(result.error);
      } else {
        const url = `${window.location.origin}/invite/${result.id}`;
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
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-stone-200 bg-white p-4"
    >
      <h3 className="mb-3 text-sm font-semibold text-stone-700">
        Add Guest (non-photo)
      </h3>
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={names}
          onChange={(e) => setNames(e.target.value)}
          placeholder="Names (comma-separated)"
          className="min-w-48 flex-1 rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-500"
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
          className="min-w-48 flex-1 rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-500"
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

/* ─── Sort header ─── */

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-700"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (
          <svg
            className={`h-3 w-3 transition-transform ${currentDir === "desc" ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        )}
      </span>
    </th>
  );
}

/* ─── Filter pills ─── */

type FilterKey = "all" | "seen" | "unseen" | "accept" | "decline" | "pending" | "ceremony";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "seen", label: "Seen" },
  { key: "unseen", label: "Unseen" },
  { key: "accept", label: "Accepted" },
  { key: "decline", label: "Declined" },
  { key: "pending", label: "Pending" },
  { key: "ceremony", label: "Ceremony" },
];

/* ─── Guest Table ─── */

function GuestTable({
  rows,
  onRefresh,
}: {
  rows: GuestRow[];
  onRefresh: () => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("names");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = rows;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.names.toLowerCase().includes(q) ||
          r.vnTitle.toLowerCase().includes(q)
      );
    }

    if (filter === "seen") result = result.filter((r) => r.isSeen);
    else if (filter === "unseen") result = result.filter((r) => !r.isSeen);
    else if (filter === "accept")
      result = result.filter((r) => r.rsvpStatus === "accept");
    else if (filter === "decline")
      result = result.filter((r) => r.rsvpStatus === "decline");
    else if (filter === "pending")
      result = result.filter((r) => r.rsvpStatus === "pending");
    else if (filter === "ceremony") result = result.filter((r) => r.ceremony);

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "names") cmp = a.names.localeCompare(b.names);
      else if (sortKey === "rsvpStatus")
        cmp = a.rsvpStatus.localeCompare(b.rsvpStatus);
      else if (sortKey === "isSeen") cmp = Number(a.isSeen) - Number(b.isSeen);
      else if (sortKey === "rsvpDate")
        cmp = (a.rsvpDate || "").localeCompare(b.rsvpDate || "");
      else if (sortKey === "ceremony")
        cmp = Number(a.ceremony) - Number(b.ceremony);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [rows, search, filter, sortKey, sortDir]);

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
  const seenCount = rows.filter((r) => r.isSeen).length;

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
    const url = `${window.location.origin}/invite/${id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <>
      <AddGuestForm onCreated={onRefresh} />

      {/* Summary stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
          <p className="text-xl font-semibold text-stone-800">{rows.length}</p>
          <p className="text-xs text-stone-500">Total guests</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xl font-semibold text-emerald-700">
            {accepted.length}
            <span className="ml-1 text-sm font-normal">
              ({totalAttending} pax)
            </span>
          </p>
          <p className="text-xs text-emerald-600">Accepted</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xl font-semibold text-red-700">
            {declined.length}
          </p>
          <p className="text-xs text-red-600">Declined</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
          <p className="text-xl font-semibold text-stone-500">
            {rows.length - accepted.length - declined.length}
          </p>
          <p className="text-xs text-stone-400">Pending</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xl font-semibold text-blue-700">
            {seenCount}
            <span className="ml-1 text-sm font-normal text-blue-500">
              / {rows.length}
            </span>
          </p>
          <p className="text-xs text-blue-600">Viewed invite</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="w-56 rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-700 outline-none focus:border-stone-400"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-stone-800 text-white"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-stone-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table — compact rows, click to expand */}
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="w-8 px-3 py-3" />
              <SortHeader
                label="Name"
                sortKey="names"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Seen"
                sortKey="isSeen"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="RSVP"
                sortKey="rsvpStatus"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Note
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const isOpen = expanded === row.id;
              return (
                <Fragment key={row.id}>
                  {/* Main row */}
                  <tr
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                    className={`cursor-pointer border-b border-stone-100 transition-colors ${isOpen ? "bg-stone-50" : "hover:bg-stone-50/60"}`}
                  >
                    {/* Chevron */}
                    <td className="px-3 py-3">
                      <svg
                        className={`h-4 w-4 text-stone-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </td>

                    {/* Name + avatar + badges */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {row.avatar ? (
                          <img
                            src={row.avatar}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-stone-200"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold text-stone-500 ring-1 ring-stone-200">
                            {row.names.charAt(0)}
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-stone-800">
                              {row.names}
                            </p>
                            <div className="flex items-center gap-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                                  row.hasPhotos
                                    ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                    : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                }`}
                              >
                                {row.hasPhotos
                                  ? `${row.photoCount} photos`
                                  : "invite"}
                              </span>
                              {row.ceremony && (
                                <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                                  ceremony
                                </span>
                              )}
                            </div>
                          </div>
                          {row.vnTitle && (
                            <p className="text-xs text-stone-400">
                              {row.vnTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Seen */}
                    <td className="px-4 py-3">
                      {row.isSeen ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {row.seenAt
                            ? new Date(row.seenAt).toLocaleDateString()
                            : "Yes"}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-300">-</span>
                      )}
                    </td>

                    {/* RSVP */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[row.rsvpStatus] ?? STATUS_STYLES.pending}`}
                      >
                        {row.rsvpStatus}
                      </span>
                    </td>

                    {/* Note (inline, click stops propagation) */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <NoteCell guestId={row.id} initial={row.note} />
                    </td>

                    {/* Quick actions */}
                    <td
                      className="whitespace-nowrap px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyInviteUrl(row.id)}
                          title="Copy invite URL"
                          className="rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V9.5A1.5 1.5 0 0 1 12 11V8.621a3 3 0 0 0-.879-2.121L9 4.379A3 3 0 0 0 6.879 3.5H5.5Z" />
                            <path d="M4 5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 14h5a1.5 1.5 0 0 0 1.5-1.5V8.621a1.5 1.5 0 0 0-.44-1.06L7.94 5.439A1.5 1.5 0 0 0 6.878 5H4Z" />
                          </svg>
                        </button>
                        {!row.hasPhotos && (
                          <button
                            onClick={() => handleDelete(row.id)}
                            disabled={deleting === row.id}
                            title="Delete guest"
                            className="rounded p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isOpen && (
                    <tr className="border-b border-stone-100 bg-stone-50/50">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="ml-11 grid grid-cols-2 gap-x-12 gap-y-3 sm:grid-cols-4">
                          <DetailField label="Guests" value={row.rsvpGuests ? String(row.rsvpGuests) : "-"} />
                          <DetailField label="Meal" value={row.rsvpMeal || "-"} />
                          <DetailField
                            label="RSVP Date"
                            value={
                              row.rsvpDate
                                ? new Date(row.rsvpDate).toLocaleString()
                                : "-"
                            }
                          />
                          <DetailField
                            label="Seen At"
                            value={
                              row.seenAt
                                ? new Date(row.seenAt).toLocaleString()
                                : "-"
                            }
                          />
                          <div className="col-span-2 sm:col-span-4">
                            <DetailField
                              label="Message"
                              value={row.rsvpMessage || "-"}
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-4">
                            <DetailField label="Invite ID" value={row.id} mono />
                          </div>
                          {!row.hasPhotos && (
                            <div className="col-span-2 pt-1 sm:col-span-4">
                              <button
                                onClick={async () => {
                                  const ok = await updateGuestCeremony(
                                    row.id,
                                    !row.ceremony
                                  );
                                  if (ok) onRefresh();
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                                  row.ceremony
                                    ? "bg-purple-50 text-purple-700 ring-purple-600/20 hover:bg-purple-100"
                                    : "bg-stone-100 text-stone-500 ring-stone-500/10 hover:bg-stone-200"
                                }`}
                              >
                                {row.ceremony
                                  ? "Remove from ceremony"
                                  : "Add to ceremony"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">
            No guests match your filter
          </p>
        )}
      </div>
    </>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm text-stone-700 ${mono ? "font-mono text-xs select-all" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Groups panel ─── */

function GroupsPanel({ groups }: { groups: InviteGroupDisplay[] }) {
  return (
    <div>
      <p className="mb-4 text-xs text-stone-400">
        Manage groups via{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-500">
          scripts/invite_groups.json
        </code>
      </p>

      {groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-stone-400">
          No groups yet
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group, i) => (
            <div
              key={i}
              className="rounded-lg border border-stone-200 bg-white p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {group.memberDetails.map((m) => (
                    <img
                      key={m.id}
                      src={m.avatar}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {group.memberDetails
                      .map((m) => m.names.join(" & "))
                      .join(" + ")}
                  </p>
                  <div className="flex gap-2 text-xs text-stone-400">
                    {group.vnTitle && <span>Title: {group.vnTitle}</span>}
                    {group.message && <span>Msg: {group.message}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard ─── */

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TableKey>("guests");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [guestRows, setGuestRows] = useState<GuestRow[]>([]);
  const [groups, setGroups] = useState<InviteGroupDisplay[]>([]);
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

  const loadGroups = async () => {
    const g = await fetchInviteGroups();
    setGroups(g);
  };

  const switchTab = (tab: TableKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setLoading(true);
    if (tab === "guests") {
      fetchGuestList().then((data) => {
        setGuestRows(data);
        setLoading(false);
      });
    } else if (tab === "groups") {
      loadGroups().then(() => setLoading(false));
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tab bar */}
        <div className="mb-6 flex gap-1 border-b border-stone-200">
          {TABLES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "text-stone-800"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {label}
              {counts[key] !== undefined && (
                <span
                  className={`ml-1.5 text-xs ${activeTab === key ? "text-stone-500" : "text-stone-300"}`}
                >
                  {counts[key]}
                </span>
              )}
              {activeTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-stone-400">
            Loading...
          </p>
        ) : activeTab === "guests" ? (
          <GuestTable
            rows={guestRows}
            onRefresh={() => {
              fetchGuestList().then(setGuestRows);
              fetchAllCounts().then(setCounts);
            }}
          />
        ) : activeTab === "groups" ? (
          <GroupsPanel groups={groups} />
        ) : (
          <GenericTable rows={rows} />
        )}
      </div>
    </div>
  );
}

/* ─── Entry ─── */

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!supabase.auth.getSession();
  });
  const [checked, setChecked] = useState(false);

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
