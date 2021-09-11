# Changelog

All notable changes to this project will be documented in this file.

## [Experimental]

### Added
    - Ability to enable/disable printers

## [v1.2-rc2]

### Added
    - Task scheduler: runs periodic tasks for OctoFarm in a controllable, periodic manner.
    - Added line counter to ticker log
    - Refactored task manager so it becomes easier to use
    - Global Client Error Handler: Grabs any errant / uncaught errors and displays a modal

### Changed
    - File manager: gave printer titles a badge. Gave selected printer a yellow border. Reduced file list minimum height (for smaller screens). 
    - Refactor of History Runner with new OctoPrint Client service and added test coverage.
    - Refactor of Printer Manager client view templates. All Manager functions under seperate dropdowns, wider connection log.
    - Refactor of Printer Manager client code bringing a little speed boost (avg 40fps -> 50fps) and better fault tolerance. 
    - Refactor of SSE client into re-usable file. 
    - Moved the "API Errors" button, now appears on the start of a printer row and clicking will take you straight into Printer Settings.
    - Refactor monitoring pages (panel, list, camera) with latest SSE client reusability.
    - Refine the printer map layout with borders and printer quick actions (page not public yet).
    - Reduced logging (we will bring it back later in different shape with an Exception handler)
    - Replaced fetch with axios in the local OctoFarm client calls.  
    - Moved all error handling for client connections into axios calls
    - Refactored System page into separate manageable files ejs/js, cleaned up a lot of code. 
    - Updated the system page layout. 
    - Moved filament manager plugin actions to separate service file. 
    - Reworked backend with awilix dependency injection (lot of changes), caches and stores
    - Cleaned up printer API
    - Cleaned up alerts and scripts API 
    - Cleaned up room data API
    - Refactored WebSocket Task, OctoPrint API (axios) and PrinterState dependencies to be more explicit about connection errors

### Removed
    - Removed possibilty for OctoPrint API to retry by itself. This is now done on scheduling level to with printer state management. 

### Fixed
    - Fixed #665: If Global API check fails due to intial time out, never recovered and tried again increasing timeout.
    - Fixed #670: File manager initial and subsequent scans we're not recursive. 
    - Fixed #669: File manager scroll wouldnt reset after switching printer.
    - Fixed #590: The Back button now disables when there's no folder to go back to.
    - Fixed #679: OctoFarm would stall on air gapped farms due to checking for OP updates.
    - Added Filament Clean back to start up so filament manager and spools list load.
    - Fixed #605: Tool total would show "null" if no spool selected. 
    - Issue with totals not been counted with/without a spool selected on Printer Control.
    - Fixed #667: Weekly Utility was not loading the previous days values.
    - Fixed #698: Current Operations would try to load the old browser worker. Replaced with sse client.
    - Fixed #681: Current Operations would load on dashboard even when not enabled in settings

## [v1.2-rc1]

### Added
    - Added #546: Node 13 or lower issue webpage with instructions, doesnt restart server anymore 
    - Added #509: HTTP/HTTPS support for websocket connections
    - #628 Split client package.json and published package @octofarm/client to NPM 

### Changed
    - Completely reworked history cache, prepared and tested for OctoFarm V2
    - Slightly reworked file cache, prepared for V2 and made it robust
    - Made API tests less prone to unnecessary failure
    - Reworked the Settings modal to be more resiliant to failure and cleaned up code
    - Slightly reworked job cache, prepared for V2
    - Added the ability to override the automatic wss:// select for HTTPS in printer settings modal. 
    - Added the ability for settings dialog to return to "Printer Online" view when printer comes online in background / from settings changes.
    - Amended the functions for Global OctoPrint update and Global OctoPrint plugin update
    - The core `state` of OctoFarm is split off of OctoPrint and added possibilities to test it fully 
    - Rewrote imports and entrypoint of frontend javascript for webpack
    - Added Webpack to replace Gulp frontend bundler
    - Rewrote dashboard page and completely refactored javascript code in browser
    - Moved filament cleaner startup to app-core
    - Made NODE_ENV to be production by default causing the @octofarm/client bundle to be loaded and console logging to be filtered with level INFO/ERROR

### Removed
    - Gulp packages and gulp as bundler

### Fixed
    - Fixed #531 - Updated settings are not grabbed when opening settings modal
    - Fixed #532 - Actual save port is not checked against live ports on OctoPrint on settings Modal
    - Fixed #567: heatmap error (race condition) in PrinterClean for any newly created database
    - Fixed #576, #577: correct some function calls in PrinterClean
    - Fixed #542, #381: ensureIndex mongoose warning and circular Runner import resolved 
    - Fixed #598: printer settingsAppearance missing will not cause failure anymore
    - Fixed #596: changed OctoPrint plugin manager repository to new route with backwards compatibility version check 
    - Fixed #608: Global update button was not appearing
    - Fixed #555: Offline after error not caught by OctoFarm. 1.6.0+
    - Fixed #609: Bulk printer functions wouldn't load due to small regression bug
    - Fixed #587: Changing printer URL doesn't rescan for changes when using settings modal
    - Fixed #592: Printer host is marked Online when URL is not correct / fake
    - Fixed #574: Reworked the statejs OctoPrint client and added tests
    - Fixed #630: System Info calls took huge amount of event-loop time (>2000ms) on Windows with a 2500ms interval period. Disabled for huge performance loss.
    - Fixed #641: Opening the console on the Printers Page with offline printers would crash the browser due to spam.
    - Fixed #638: Fixed login not working anymore after refactor
    - Fixed `snapshots` instead of `snapshot` bug on client system Javascript bundle
    - Fixed #655: Server-sent events were failing due to breaking import path of the flatted package. Fixed that path server-side.
    - Fixed #625 - Incorrect html tags on Printer Manager
    - Fixed #548 - Smaller screen action buttons wrapped incorrectly on Printer Manager

## [v1.1.13-hotfix]

### Added
    - Ability to use the AUTO option for baudrate
    - Ability to click update button to go to system page

### Changed
    - Completely re-worked the auto updater mechanism
    - Completely re-worked the npm check and installation mechanism for the auto updater 

### Removed

### Fixed
    - Fixed #500: Connection to printer would fail when both baudrate and port are set to "AUTO"
    - Fixed #501: Restart command fired too fast which resulted in no confirmation/error notification on client.
    - Fixed #495: Check for update would result in double notifications for airgapped farms
    - Fixed #498: Fix package version not always preset and synced correctly when not running npm commands, f.e. pm2


## [v1.1.13]

### Added
    - Added #361: OctoFarm release check and notification sets ground work for automatic updates
    - Added #373: Migrated MongoUri in config/db.js to new .env file format as MONGO=...
    - Added #374: Migrated server port to .env file as OCTOFARM_PORT=...
    - Added #351: Background image now ignored and copied from default if not present at start.
    - Added #382: Add in ability for OctoFarm to update itself with the current pm2/git implementation
        - This is actioned by two new section inside Server -> System. Two new buttons "Force Check", "Update".
    - Added #421: OctoFarm data dump. Generates a bundled zip file for download that includes all system logs and a service_information.txt file
    - Added #296: Ability to define your own page title with an Environment Variable

### Changed
    - Disabled Restart button when not using pm2 process manager
    - Node 12 now not supported. Node 14 is a minimum requirement

### Removed
    - Ability to change the port in the UI. This is now managed by environment variables. UI option will be back soon.

### Fixed
    - Fixed #240: Commands sent from the Printer Control Terminal would double wrap array.
    - Fixed #358: Spool Manager not allowing input of decimal places.
    - Fixed #398: Added back in power reset buttons.
    - Fixed #353: Filament Manager Spools list is not ignoring Spools Modal pagination.
    - Fixed #386: Server update notification would show to all users, not just Administrator group.
    - Fixed #430: Replace user and group check with middleware.
    - Fixed #396: History cleaner wouldn't run after print capture.
    - Fixed #397: Thumbnails wouldn't capture on history, even with setting on.
    - Fixed #414: History failing to generate due to missing default settings.
    - Fixed #438: File manager fails to load due to toFixed error.
    - Fixed #442: Re-Input catch statements for "git" commands on updater logic.
    - Fixed #444: Add in npm functions for updater command to keep packages up to date.
    - Fixed #439: Views not updating due to offline printer in first instance.
    - Fixed #414: History would fail to capture due to missing settings. 
    - Fixed #475: Loading system page would cause error in console due to missing settings.
    - Fixed #459: Duplicate Id's on printer manager page. 
    - Fixed #472: System page would crash if release check didn't find a release. 
    - Fixed #460: Update and Restart commands not correctly erroring and returning to client.
    - Fixed #468: Disable update notification and buttons to docker installs. 
    - Fixed #452: Docker documnetation was missing path for /images.
    - Fixed #478: Abort with a friendly message if Node version less than 14 is detected.
    - Fixed #429 and #378: Memory/CPU graphs in system page now tolerant to missing values so it can show no matter what. 
    