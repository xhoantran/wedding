"use server";

import { createClient } from "@supabase/supabase-js";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

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
  const inviteId = formData.get("inviteId") as string | null;

  if (!name || !attendance) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    if (inviteId) {
      // Supabase upsert for invited guests
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase
        .from("rsvps")
        .update({
          name,
          email,
          attendance,
          guests: attendance === "accept" ? parseInt(guests) || 1 : 0,
          meal: attendance === "accept" ? meal : "",
          message,
          updated_at: new Date().toISOString(),
        })
        .eq("invite_id", inviteId);

      if (error) {
        console.error("Supabase RSVP error:", error);
        return { success: false, error: "Something went wrong. Please try again." };
      }
    } else {
      // File-based fallback for anonymous visitors
      const entry = {
        name,
        email,
        attendance,
        guests: attendance === "accept" ? guests : "0",
        meal: attendance === "accept" ? meal : "",
        message,
        submittedAt: new Date().toISOString(),
      };

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
    }

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
