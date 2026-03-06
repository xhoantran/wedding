#!/usr/bin/env python3
"""Seed Supabase invites table and rewrite guests.json with UUID keys.

After running generate_guests.py (which produces slug-keyed guests.json),
run this script to:
1. Create/fetch UUIDs in Supabase invites table for each guest
2. Rewrite guests.json with UUID keys (replacing slug keys)
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

    # Build UUID-keyed guests
    uuid_guests: dict = {}

    for guest_code in sorted(guests.keys()):
        # Check if already exists in Supabase
        existing = sb.table("invites").select("id").eq("guest_code", guest_code).execute()

        if existing.data:
            uuid = existing.data[0]["id"]
            print(f"  exists  {uuid}  {guest_code}")
        else:
            result = sb.table("invites").insert({"guest_code": guest_code}).execute()
            uuid = result.data[0]["id"]
            print(f"  created {uuid}  {guest_code}")

        uuid_guests[uuid] = guests[guest_code]

    # Rewrite guests.json with UUID keys
    with open(GUESTS_FILE, "w") as f:
        json.dump(uuid_guests, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Rewrote {GUESTS_FILE.name} with {len(uuid_guests)} UUID-keyed entries.")


if __name__ == "__main__":
    main()
