# FDM Monster 13/04/2024 1.6.1

Changes:

- Dropped the permission check on /api/features as it made no sense

Fixes:

- YAML Import would fail updating properly an existing floor by floor level
- YAML Import has issues updating a floor, printers positions are not consistently are updated.
- YAML Import converted printer IDs to string, causing the printers to not show up on the printer grid until server restart. The import was done correctly on database level.
- Deleting a printer would remove the position of another printer, the removal was referring to the wrong position.


