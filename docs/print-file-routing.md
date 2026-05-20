# Print File Routing

FDM Monster can work out **which printer** a sliced file is meant for, instead of you assigning every upload by hand. This is useful when you run more than one printer model, or a farm of identical machines.

## How a file is routed

Every file carries a **routing target** — a short text label. FDM Monster resolves that label to printer(s):

1. **Exact printer name** (case-insensitive) → that one printer.
2. Otherwise a **printer tag** name → every printer carrying that tag (a "group").
3. No match → the file is left unassigned; you pick a printer in the UI.

When a target resolves to exactly **one** printer, the file is automatically added to that printer's queue. Ambiguous (a tag with several printers) or unmatched files are never auto-queued — they wait for a manual choice.

There are two ways a file gets its routing target.

## Signal 1 — watched folder (recommended)

Point FDM Monster at a folder and drop files into per-printer or per-tag subfolders. No slicer configuration, works with any slicer, and works for gcode downloaded from the web.

Environment variables:

| Variable | Meaning |
|---|---|
| `WATCHED_FOLDER_PATH` | Absolute path FDM Monster watches. Unset = feature off. |
| `WATCHED_FOLDER_MODE` | `consume` (default) moves imported files into the library. `library` copies them, leaving the originals in the watched folder; already-imported files are skipped on re-scan. |

FDM Monster auto-creates two **addressing schemes** at the root and keeps a subfolder under them for every printer and tag (created on startup and when printers change):

```
/watched/
  by-printer/        -> address a specific printer instance
    Prusa Mini #1/
      bracket.gcode
  by-tag/            -> address a printer tag (a group); FDM Monster picks the instance
    voron-fleet/
      case.gcode
```

Drop a file under `by-printer/<name>/` to route it to that exact printer, or under `by-tag/<name>/` to route it to that tag's group of printers. A file dropped anywhere else (the root, an unknown folder) keeps whatever target its gcode declares (see Signal 2), or stays unassigned.

## Signal 2 — `fdmm_target` gcode comment

Embed the routing target in the gcode itself by adding one comment line to your slicer's printer-profile **Start G-code**:

```
; fdmm_target = prusa-mini
```

It's a comment — printers ignore it. Where to add it per slicer:

| Slicer | Location |
|---|---|
| PrusaSlicer / SuperSlicer | Printer Settings → Custom G-code → Start G-code |
| OrcaSlicer / Bambu Studio | Printer Settings → Machine G-code → Machine start G-code |
| Cura | Preferences → Printers → Machine Settings → Start G-code |
| Simplify3D | Process → Scripts → Starting Script |

## Precedence

If a file arrives through the watched folder **and** its gcode contains an `fdmm_target` line, the **folder wins**. A mismatch is logged as a warning so you can spot a misfiled print.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/routing/resolve/:fileStorageId` | Show which printer(s) a stored file resolves to. |
| `POST /api/routing/queue/:fileStorageId` | Resolve and, if unambiguous, queue the file. |
