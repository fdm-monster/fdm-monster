# Develop

# FDM Monster 2.0.4

## Hotfix

- DATABASE_FILE and DATABASE_PATH weren't picked up from .env as dotenv path was wrong

# FDM Monster 2.0.4

## Feature

- Added mdns based Docker image for advanced users, who want to enable mDNS with Docker and a Docker bridge network connected to a MAC-VLAN.

## Fixes

- YAML import was too strict for printer properties: disabledReason, username and password. feedRate, flowRate and assignee are now also imported

## Chore

- Remove unnecessary debug logging for job analysis service when it had nothing to do
- Remove install.sh

# FDM Monster 2.0.3

Hotfix release

- Client wasn't updated to 2.2.0

# FDM Monster 2.0.2

## Features

- Printer maintenance log
- Added ENV_FILE env variable to override path for .env file
- Added MEDIA_PATH env variable to override media storage folder

## Fixes

- DATABASE_PATH env variable will now respect its value if set, instead of forcing it to be relative

## Chores

- Remove corepack from CICD as yarn is committed to repository
- Switch docker container base to node 24
- PrintJob entity printer relation improved

# FDM Monster 2.0.1

## Feat

- Add grid sorting option frontend settings
- YAML export now includes credential settings (jwtExpiresIn, refreshTokenAttempts, refreshTokenExpiry, slicerApiKey)
- YAML import now properly imports credential settings including slicerApiKey
- Ability to analyze/re-analyze file from Files page upload

## Fixes

- YAML import restores credentials using sensitive settings method in SettingsStore
- YAML export would not export printer username and password

# FDM Monster 2.0.0

## Feat

- All UI features in https://github.com/fdm-monster/fdm-monster-client-next/blob/main/RELEASE_NOTES.MD
- Add mock camera console to project (for development)
- Add swagger and OpenAPI integration
- UI Client is now fdm-monster-client-next at v2.0.0
- Add color option to tag
- Add API to upload from slicer
- Change API to /api/v2
- Queue
- PrintJob
- File Analysis

## Fixes

- Renames PrinterFloors permission group to Floors
- Load printer files in background instead of synchronously
- BambuLab connection rejections cannot cause server crashes anymore
- Default grid size is now 4 by 2 (which is less overwhelming)
- Floor service wouldn't update printer position, comparison was x==x, y==x
- ExceptionFilter now logs using loggerFactory
- YAML import service was brittle against printer type failures, added robustness
- Camera should tolerate printer deletion: SET NULL applied to Foreign Key
- Quick stop API endpoint moved to printer controller, removing the need for custom gcode api controller.
- Drop printer file clean task, outdated concept
- File uploads now go to media/file-uploads instead of media
- First-time-setup api filter now allows swagger endpoints
- Floor order change not properly implemented in API service
- Remove experimental thumbnail support

## Chore
- Remove batch/single set gcode analysis to false
- Removed client next experimental setting
- Drop unused Custom Gcode table
- Drop broken PrintCompletion table
- Rename PrinterGroup to PrinterTag, and Group to Tag

# FDM Monster 2.0.0-rc1

## Features

- Remove mongodb support (breaking change)
- Reimplement role system based on RoleName (not id and name)
- Cleanup and remove unused permission table
- Key-diff cache is now Map instead of Object

## Fixes

- Update printer now replaces old socket with new one

# FDM Monster 1.9.4

## Fixes

- Bambu mqtt adapter should connect using mqtts
- Bambu FTP works with .3mf (as well as gcode), FDM Monster now supports 3mf upload for bambu printer types
- Bambu: implemented socket state emitting for test functionality
- PrusaLink: implemented socket state emitting for test functionality
- Bambu: download file implemented via FTP
- FDM-Monster API: file upload now checks file extension after upload (not during upload)

# FDM Monster 1.9.3

## Fixes

- Bambu port was 1883 in code instead of 8883
- Removed confusing app constants wrongly suggesting mqtt configuration is an option

# FDM Monster 1.9.2

## Features

- Full yaml export with users, roles, settings
- Full yaml import (especially when getting started)
- Experimental bambu lab support (tested with mock bambu server)

## Fixes 

- Floor: sqlite floor level would start at 0, not 1
- YAML export: Mongo floor printer position would yaml export printerId as {} instead of string

# FDM Monster 1.9.1

## Updates

- Resolve CVE multer vulnerabilities by updating to 2.0.2

# FDM Monster 1.9.0

## Features

- Introduce separate upload timeout setting for better control and resilience
- Ability to add startPrint to specify print or not after upload

## Fixes

- OctoPrint 1.8.7 needs explicit passive flag in body instead of header to login
- PrusaLink subfeature was not added to printer type feature (new client packaged)
- Improve Moonraker error logging
- Make colored logs opt-in with "ENABLE_COLORED_LOGS: true" env var
- SocketIO gateway logs errors more explicitly
- Logger is now static, reducing memory usage and test duration

# FDM Monster 1.9.0-rc1

## Features

- Introduce PrusaLink adapter for limited printer support for these printers: MK3S(+) (needs PrusaLink extension with Raspberry Pi), Mini(+), MK4(S), XL, Core One
- Add opt-in Prometheus integration (still experimental)
- Add opt-in Loki integration (still experimental)

## Chores

- Remove unused code for OctoPrint plugin support (this work needs to go through triage again)
- Remove unused code for OctoPrint plugin backup (this work needs to go through triage again)
- Remove unused code for OctoPrint plugin firmware update (this work needs to go through triage again)
- Remove unused code for OctoPrint plugin repository
- Remove unused code for Prusa firmware releases
- Remove printer API endpoints for OctoPrint plugins, backups and firmware updates
- Remove cache-manager package
- Remove unused console files
- Update .env.template
- Removed BaseEntity
- Make printerId camera nullish
- Merge create and update schema floor
- Schema printerPositionsSchema simplified
- Add biome linter/formatter, remove prettier and eslint

## Changes

- `tsconfig.json` strictNullChecks and strictPropertyInitialization set to true for better null propagation logic.
- Update dependency injection with awilix, switch to CLASSIC mode for less verbose code
- Update API controller, use decorators over api builder
- Remove PrinterFile entity (unused)
- Remove printer/connection PATCH endpoint (unused)
- Remove debug settings from server settings database
- Remove all API compatibility feature flags except for printerGroupsApi and multiplePrinterServices

## Fixes

- Fix punycode warning by pinning tr46 package
- Fix camera dto and entity to be consistent
- Make yaml import fill in default arrays
- Make printCompletionSchema context type any
- Enforce properties on camera stream Mongoose schema for consistency with TypeORM camera stream entity
- Enforce floor id on Mongoose schema for consistency with TypeORM floor entity
- Set floor id in Mongoose floor service for consistency with typeorm service
- Fix print completion interface and dto
- Improved API key validation: klipper validation completely isolated from OctoPrint api key validation
- Query parameter `forceSave` in printer create/update API was used incorrectly (flipped around)
- Fixed all typescript issues
- Server settings would not always migrate properly
- Printer files store will not cache files of disabled printers
- Klipper printer should print on upload

# FDM Monster 19/03/2025 1.8.3

## Fixes

- Introduce HttpClientBuilder pattern for Octoprint client
- Fix Sentry usage has updated
- Fix upload progress was not updated properly
- Fix failures and completions in file upload to OctoPrint/Moonraker were not consistently pushed over SocketIO
- Fix Moonraker file upload did not track upload, failure or completion
- Fix Moonraker file upload did not try-catch failures
- Fix thumbnail is now parsed after file upload instead of before, preventing premature thumbnail switch in case of upload failure.
- Fix file uploads were never unlinked, except for server startup.

# FDM Monster 03/01/2025 1.8.2

## Changes

- Update client to 1.8.8

## Chore

- Change developer setup to be node based only (remove concurrently and nodemon packages)
- Replace server restart with NotImplementedException
- Remove simple-git package
- Remove git-pull-based server update mechanic
- Remove unnecessary environment utilities

## Fixes

- OctoPrint client: filter folders on calling getLocalFiles for OctoPrint

# FDM Monster 13/12/2024 1.8.1

## Changes

- Update to client 1.8.4

## Fixes

- YAML import: regression caused all imports to fail validation
- YAML import: a bug caused all import with printers without api key to fail validation

# FDM Monster 02/12/2024 1.8.0

## Chores

- Remove unused influxdb v2 service and package

## Fixes

- Moonraker 'notify_service_state_changed' event: sometimes the moonraker services object can miss properties
- PrinterEventsCache: remove cache protection against deleted keys as this caused retry loops to stop updating printer state. Cache prevention on this level is too rough and needs to be moved to the place responsible for socket deletion.
- WebsocketAdapters (OctoPrint, Moonraker): prevent a deleted socket from entering cache state again by silencing the event emits in the printer socket
- Url http/https normalization: Printer loaded over https:// wont open websocket over wss://

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
- Update Octoprint websocket with refresh interval, defaulting to 10sec. This loop will keep refresh attempts internal to the Websocket adapter of each service type (Octoprint, Moonraker, etc).

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
