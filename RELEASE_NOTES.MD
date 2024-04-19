# FDM Monster 13/04/2024 1.6.1

## Features:

- Add GitHub Rate Limit API endpoint GET /api/server/github-rate-limit
- Add feature flag for GitHub Rate Limit API endpoint

## Changes:

- Dropped the permission check on /api/features as it made no sense
- Anonymized logging
- Handle OctoKit errors (ExternalServiceErrors) differently than OctoPrint errors (different HttpClient implementations). Refer to the new rate limit API and feature flag.
- Set default API call timeout to 10000 milliseconds (to call OctoPrint APIs)

## Fixes:

- YAML Import would fail updating properly an existing floor by floor level
- YAML Import has issues updating a floor, printers positions are not consistently are updated.
- YAML Import converted printer IDs to string, causing the printers to not show up on the printer grid until server restart. The import was done correctly on database level.
- Deleting a printer would remove the position of another printer, the removal was referring to the wrong position.
- Setting demo mode will not set wizard to be completed: first time setup will be required after setting demo mode to false.
- Settings: incorrect file clean shape would not throw any validation errors (SQLite only). Validation has been added for file clean on API level.
- Settings: make all settings API endpoints stricter by adding validation on API level. Patching is not possible anymore.
- Printer: add OctoPrint URL validation which parses the error with user friendly errors as result
