# 3D Hub [![GitHub stars](https://img.shields.io/github/stars/3d-hub/3d-hub)](https://github.com/3d-hub/3d-hub/stargazers) ![GitHub issues](https://img.shields.io/github/issues/3d-hub/3d-hub?color=green) [![GitHub forks](https://img.shields.io/github/forks/3d-hub/3d-hub)](https://github.com/3d-hub/3d-hub/network) [![Latest Release](https://img.shields.io/github/release/3d-hub/3d-hub)](https://img.shields.io/github/v/tag/3d-hub/3d-hub?sort=date) ![Coverage](https://img.shields.io/codecov/c/github/3d-hub/3d-hub)

**_The server for managing 3D printers with great overview_**

3D Hub is a bulk OctoPrint manager and dashboard written in Vue with Typescript meant to be accessed local, remote, offline or online. The work and effort - which was fully invested into OctoFarm by the authors of 3D Hub - is now boosted 🚀 for higher code quality 😎 and robustness 💪. The goals are to deliver a much smoother initial setup and 100% clear user experience to ensure you can smash those printing records 🖨️!

Note: our aim is to support all kinds of 3D Printer (FDM, resin) API's with a plugin system and documentation for extensibility. Read more about this in the roadmap section below.

<!--  ![Docker Pulls](https://img.shields.io/docker/pulls/3d-hub/3d-hub) -->
<!-- ![GitHub release (latest by date)](https://img.shields.io/github/downloads/3d-hub/3d-hub/latest/total) -->

## Stability

This server is currently not yet released, so give it a star ⭐and be the first to experience it! 

#### Last finished: printer file commander and printer location map
#### Current work: printer group, setting and location management

## Development [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/3d-hub/3d-hub/graphs/commit-activity) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/3d-hub/3d-hub/Node.js%20CI/development) [![GitHub license](https://img.shields.io/github/license/3d-hub/3d-hub)](https://github.com/3d-hub/3d-hub/blob/master/LICENSE.txt)

This work is under active development with cutting edge tech and standards. Feel like joining in? Your options are to create a pull-request, send an email, or open a discussion!

## Roadmap

- [x] Vue app core and distribution setup on NPM completed
- [x] Client for basic management of OctoPrint printers (file storage, print upload and printer management)
- [x] Printer Location Map based on 2x2 groups
- [x] Server resilient against database connection failures with automatic retry of 5 seconds
- [!] Printer Group management
- [!] Full API and client test coverage >80% (now at 50%+) 
- [~] NodeJS Server legacy-free (history, alerts, custom gcode and filament)
- [ ] OctoPrint Plugin release & Filament Tracker 
- [ ] Better authentication and user management
- [ ] Raspberry Pi image and prebuilt customized OctoPi image
- [ ] First core release with documentation

There are a lot of plans in the making (f.e. tunneling, auto-discovery, plugin system,  etc.), which will be announced as we go!

## License
Distributed under GNU Affero General Public License v3.0. See `LICENSE` for more information.

## Contact
- Main repository: [https://github.com/3d-hub/3d-hub](https://github.com/3d-hub/3d-hub)
- Discord: T.B.A.
