#!/usr/bin/env python3
"""Seed Supabase invites table from public/data/guests.json."""

import json
import os
from pathlib import Path

from supabase import create_client

GUESTS_FILE = Path(__file__).parent.parent / "public" / "data" / "guests.json"


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

    for guest_code in sorted(guests.keys()):
        # Check if already exists
        existing = sb.table("invites").select("id").eq("guest_code", guest_code).execute()

        if existing.data:
            uuid = existing.data[0]["id"]
            print(f"  exists  {uuid}  {guest_code}")
        else:
            result = sb.table("invites").insert({"guest_code": guest_code}).execute()
            uuid = result.data[0]["id"]
            print(f"  created {uuid}  {guest_code}")

    print(f"\nDone! All {len(guests)} guests have invite UUIDs.")


if __name__ == "__main__":
    main()
