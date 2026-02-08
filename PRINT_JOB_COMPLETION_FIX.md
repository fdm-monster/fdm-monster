# Print Job Completion Detection Fix

## Problem
- Progress updates hit DB every second
- Completion events missed frequently
- Duplicate/stale jobs from external triggers

## Solution

### 1. In-Memory Cache (PrinterEventsCache)
- Track active jobs: `Map<printerId, {jobId, fileName, lastProgress, lastUpdate}>`
- Throttle DB writes: 1% progress change OR 5-second interval
- Detect state transitions: `printing → idle` with high progress = complete

### 2. Auto-Completion (PrintJobService)
- At 100% progress → schedule check after 10s
- If still PRINTING at 100% → auto-complete

### 3. Periodic Cleanup (Background)
- Every 5 minutes scan for stuck jobs:
  - 100% for 5+ min → complete
  - No updates 30+ min → UNKNOWN
- Run via setInterval in constructor

### 4. State Transition Detection (OctoPrint)
- Track previous `printing` state per printer
- On transition `printing=true → false`:
  - Progress ≥95% → complete
  - Progress <95% → cancelled

## Files
- `src/services/orm/print-job.service.ts`
- `src/state/printer-events.cache.ts`


