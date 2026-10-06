#!/usr/bin/env python3
"""Convert the Calendar sheet of data/specimind-90-day-calendar.xlsx to data/calendar.csv.

The xlsx is the human's planning file and is never overwritten. data/calendar.csv is the
working copy that sessions read and update (Status column). Re-running this script would
reset Status, so it refuses to overwrite an existing CSV unless --force is given.

Usage: python3 scripts/calendar_to_csv.py [--force]
"""
import csv
import datetime as dt
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "data" / "specimind-90-day-calendar.xlsx"
CSV = ROOT / "data" / "calendar.csv"


def cell(v):
    if v is None:
        return ""
    if isinstance(v, dt.datetime):
        return v.date().isoformat()
    if isinstance(v, dt.date):
        return v.isoformat()
    if isinstance(v, dt.time):
        return v.strftime("%H:%M")
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def main():
    if CSV.exists() and "--force" not in sys.argv:
        sys.exit(f"{CSV.relative_to(ROOT)} exists (it holds live Status values). Use --force to regenerate.")
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["Calendar"]
    rows = list(ws.iter_rows(values_only=True))
    header = [cell(h) for h in rows[0]]
    out = []
    for r in rows[1:]:
        if all(v is None for v in r):
            continue
        out.append([cell(v) for v in r])
    missing = [h for h in ("Episode", "Date", "Series", "Code", "Status") if h not in header]
    if missing:
        sys.exit(f"Calendar sheet is missing columns: {missing}")
    with CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(out)
    print(f"wrote {CSV.relative_to(ROOT)}: {len(out)} rows, {len(header)} columns")


if __name__ == "__main__":
    main()
