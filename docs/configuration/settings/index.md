---
layout: default
title: Settings
parent: Configuration
nav_order: 2
has_children: true
last_modified_at: 2023-05-13T14:00:00+02:00
---

# Settings

This section specifies the settings that can be changed once the FDM Monster server has been started.

Please visit this page on FDM Monster:

![img.png](settings.png)

## Grid Settings
The Grid Settings section allows you to change the number of rows and columns in the grid, as well as enabling large tile mode. This can be useful if you want to reduce the amount of available printers in your farm.
Read more about it on the [grid settings page](grid_settings.md).

## Floors

In this section, you can create a new floor by adding a floor name and floor number, as well as change the color of the floor. This can help you organize your printer farm and easily distinguish between different floors.

## User Management

The User Management section allows you to view your current user and the time the instance was created. This can be useful for keeping track of who has access to your FDM Monster instance.

## FDM Monster Settings

The FDM Monster Settings section allows you to configure various settings related to the operation of your printer farm. You can automatically remove old print files before upload, remove old files when rebooting the server, clear file references, and bulk disable G-code analysis. These settings can help you manage the storage and performance of your printer farm.

## Emergency Commands

The Emergency Commands section currently allows you to restart the server, but we will continue to add new features in the future. Stay tuned for updates and new functionality to help you manage your printer farm more efficiently.

The following commands are available:
- **Restart Server** - restart the server (pm2 mode only)
- **Disable printers** - disable all printers
- **Enable printers** - enable all printers (except for printers in maintenance mode)
- **Connect USBs** - connect all USBs that are disconnected
- **Connect Sockets** - reset and connect all websockets, which will reconnect all clients and refresh their states
