"use server";

import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

export interface RsvpState {
  success: boolean;
  error?: string;
}

export async function submitRsvp(
  _prevState: RsvpState,
  formData: FormData
): Promise<RsvpState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const attendance = formData.get("attendance") as string;
  const guests = formData.get("guests") as string;
  const meal = formData.get("meal") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !attendance) {
    return { success: false, error: "Please fill in all required fields." };
  }

  const entry = {
    name,
    email,
    attendance,
    guests: attendance === "accept" ? guests : "0",
    meal: attendance === "accept" ? meal : "",
    message,
    submittedAt: new Date().toISOString(),
  };

  try {
    const dataDir = join(process.cwd(), "data");
    const filePath = join(dataDir, "rsvps.json");

    await mkdir(dataDir, { recursive: true });

    let existing: unknown[] = [];
    try {
      const raw = await readFile(filePath, "utf-8");
      existing = JSON.parse(raw);
    } catch {
      // File doesn't exist yet
    }

    existing.push(entry);
    await writeFile(filePath, JSON.stringify(existing, null, 2));

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
