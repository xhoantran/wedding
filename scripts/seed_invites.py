#!/usr/bin/env python3
"""Seed Supabase invites table from guests.json.

After running generate_guests.py, run this script to upsert invite rows
so the 'is_seen' tracking works when guests visit their invite links.
"""

import json
import os
from pathlib import Path

from supabase import create_client

GUESTS_FILE = Path(__file__).parent.parent / "data" / "guests.json"


def main():
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not url or not key:
        print("Error: Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.")
        print("  SUPABASE_SERVICE_KEY must be the service_role key (not the publishable one).")
        return

    sb = create_client(url, key)

    with open(GUESTS_FILE) as f:
        guests = json.load(f)

    print(f"Found {len(guests)} guests in {GUESTS_FILE.name}\n")

    for guest_id in sorted(guests.keys()):
        names = " & ".join(guests[guest_id].get("names", []))

        # Seed invite row
        sb.table("invites").upsert({"id": guest_id}, on_conflict="id").execute()

        # Seed empty RSVP row
        sb.table("rsvps").upsert(
            {"invite_id": guest_id, "name": "", "email": "", "attendance": "pending"},
            on_conflict="invite_id",
        ).execute()

        print(f"  upserted  {guest_id}  ({names})")

    print(f"\nDone! Upserted {len(guests)} invite + rsvp rows.")


if __name__ == "__main__":
    main()
