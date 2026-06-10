#!/usr/bin/env python3
"""
McMaster-Carr Order Tool — Cloud hosted on Render.com
"""

from flask import Flask, request, jsonify, send_from_directory
import gspread
from google.oauth2.service_account import Credentials
import math
import os
import json

app = Flask(__name__, static_folder="static")

SHEET_NAME = "McMaster Parts"
COL_DV     = "DV Number"
COL_MC     = "McMaster Part"
COL_PACK   = "Pack Size"

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

def get_sheet_data():
    # On Render, credentials come from an environment variable (not a file)
    creds_json = os.environ.get("GOOGLE_CREDENTIALS")
    if creds_json:
        creds_dict = json.loads(creds_json)
        creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    else:
        # Fallback to local file for development
        creds = Credentials.from_service_account_file("credentials.json", scopes=SCOPES)

    client  = gspread.authorize(creds)
    sheet   = client.open(SHEET_NAME).sheet1
    records = sheet.get_all_records()

    lookup = {}
    for row in records:
        dv   = str(row.get(COL_DV,   "")).strip().upper()
        mc   = str(row.get(COL_MC,   "")).strip()
        pack = row.get(COL_PACK, 1)
        try:    pack = int(pack)
        except: pack = 1
        if dv and mc:
            lookup[dv] = {"mcmaster_part": mc, "pack_size": pack}
    return lookup


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/lookup", methods=["POST"])
def lookup():
    data  = request.get_json()
    items = data.get("items", [])

    if not items:
        return jsonify({"error": "No items provided"}), 400

    try:
        lookup_table = get_sheet_data()
    except Exception as e:
        return jsonify({"error": f"Could not read Google Sheet: {str(e)}"}), 500

    results, errors = [], []

    for item in items:
        dv         = str(item.get("dv_number", "")).strip().upper()
        qty_wanted = int(item.get("quantity", 1))

        if not dv:
            continue
        if dv not in lookup_table:
            errors.append(f"{dv} — not found in parts sheet")
            continue

        entry        = lookup_table[dv]
        mc_part      = entry["mcmaster_part"]
        pack_size    = entry["pack_size"]
        packs_needed = math.ceil(qty_wanted / pack_size)

        results.append({
            "dv_number":      dv,
            "mcmaster_part":  mc_part,
            "qty_wanted":     qty_wanted,
            "pack_size":      pack_size,
            "packs_to_order": packs_needed,
            "units_received": packs_needed * pack_size,
        })

    return jsonify({"results": results, "errors": errors})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
