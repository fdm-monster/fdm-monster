# Develop

## Fixes

- Moonraker 'notify_service_state_changed' event: sometimes the moonraker services object can miss properties
- PrinterEventsCache: remove cache protection against deleted keys as this caused retry loops to stop updating printer state. Cache prevention on this level is too rough and needs to be moved to the place responsible for socket deletion.
- WebsocketAdapters (OctoPrint, Moonraker): prevent a deleted socket from entering cache state again by silencing the event emits in the printer socket

## Features

- Settings: add grid setting to show cancel button instead of quick stop button
- Scan and save gcode thumbnails per printer
- Support uploading .bgcode format files

# FDM Monster 25/11/2024 1.7.6

## Fixes

- UserService: MongoDB had incorrect root user checks and SQLite user service missed the check altogether. Now root user checks are robust. 
- Camera API: GUEST should not have access to change cameras
- YAML import validation: new API keys are not accepted by outdated YAML validation

# FDM Monster 23/11/2024 1.7.5

## Fixes

- Demo mode should never show first-time-setup. It would always return "first time setup completed: false". Now this will return true.
- Incorrect UI state "No USB" shown, when OctoPrint USB is disconnected.

## Features

- Remove whitelist settings from database, API, validation and remove IP package (CVE)

# FDM Monster 13/11/2024 1.7.4

## Features:

- User API: new endpoint which registers user directly with roles and without verification step

## Fixes: 

- PrinterEventsCache: when printers and test printers are deleted, the printer events cache should not be allowed to be filled by late update events

# FDM Monster 11/11/2024 1.7.3

## Fixes:

- BaseService: catch null or undefined id before querying database
- Add set user roles API to avoid users staying in limbo with GUEST role after verification.
- User API: apply consistent string number coercion in user API to avoid unexpected ID comparison

# FDM Monster 11/11/2024 1.7.2

## Fixes:

- API & Service validators: adjust max length of apiKey property validation to 43 to allow new `secrets` based OctoPrint api keys
 
# FDM Monster 04/11/2024 1.7.1

## Changes:

- Remove PrinterStateUpdatePollTask, it was slowing development down
- Stopped pushing to old davidzwa dockerhub organization

## Fixes:

- Octoprint does not require api key, but moonraker does not. Adjust API validation.
- Only printers which OctoPrint controlled need a USB silence check for restoring the websocket connectivity
- ApiKey requiredNotIf validation does not work (?)
- Batch service: missing implementation for batch get settings and batch connect
- Batch service: get and submit moonraker reprint based on history and webhooks objects
- Printer current state update task missed information about printer job and progress, caused null progress/job state
- Test connection: Moonraker adapter would not hook required events for connectivity tests
- Docker ARM64 release now tracks main instead of develop (and 1, 1.x and 1.x.y versions)

# FDM Monster 01/11/2024 1.7.0

## Chore:

- Workflows: upgrade github actions to node 20
- Introduce nock to test everything (except for octokit based tests)

## Features:

- Setting: add experimental moonraker support setting to model, validation and API endpoints
- Setting: expose experimental typeorm setting and adjust test
- Apply moonraker setting to middleware, and disable moonraker printers on disabling feature
- Enable moonraker printerType support

## Fixes:

- Add sourceMaps: "inline" to jest for hitting breakpoints with swc in Webstorm
- Printer file clean could contain extra data, skim those props off
- Batch reprint selection: wrong status is concluded when reprint preparation is called (OctoPrint is not available, instead of no job is selected)

# FDM Monster 12/26/2024 1.6.4

## Changes:

- Dropped printer file database table (kept the entity/schema), so FDMM "remote file" architecture can be redesigned. We're solely using in-memory cache from this point.
- Introduced first version of the standardized PrinterApi, the concept of multiplePrinterServices with only OctoPrint and printer type to indicate service types in the future
- Simplified the PrinterFile model, dropped unused properties for multi-print-service standardization in the future.
- Used attributes for PrinterFilesController
- Renamed OctoPrintApiService to OctoprintClient
- Switch to 1.6.x client UI version range
- Update Octoprint websocket with refresh interval, defaulting to 10sec. This loop will keep refresh attempts internal to the Websocket adapter of each service type (Octoprint, Moonraker, Bambu, etc).

## Fixes:

- Print completion service would throw exception that correlationId was not provided (SQLite didn't like that). This error is prevented.
- Moonraker type printers will resort to OctoPrint implementation (edge case in development)
- Yaml import service will not assume printerType is provided, therefore defaulting to OctoprintType for older FDM Monster versions
- Reprint will now take selected job instead of scanning the unreliable file list for latest print date

# FDM Monster 14/06/2024 1.6.3

## Fixes:

- Add .yarn folder to FDM Monster release .zip file on github release
- SQLite: Role entity name column should be unique
- OctoPrint: websocket authentication would fail when multiple users are present. Fixed the username lookup with current-user OctoPrint API endpoint

## Features:

- Moonraker: prep work by modeling the moonraker api and websocket events

# FDM Monster 13/04/2024 1.6.2

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
