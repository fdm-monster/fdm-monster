# 3D Print Farm [![GitHub stars](https://img.shields.io/github/stars/davidzwa/3d-print-farm)](https://github.com/davidzwa/3d-print-farm/stargazers) ![GitHub issues](https://img.shields.io/github/issues/davidzwa/3d-print-farm?color=green) [![GitHub forks](https://img.shields.io/github/forks/davidzwa/3d-print-farm)](https://github.com/davidzwa/3d-print-farm/network) [![Latest Release](https://img.shields.io/github/release/davidzwa/3d-print-farm)](https://img.shields.io/github/v/tag/davidzwa/3d-print-farm?sort=date) ![Coverage](https://img.shields.io/codecov/c/github/davidzwa/3d-print-farm)

**_The server for managing 3D printers with great overview_**

3DPF is an 3D printer manager and dashboard written in Vue with Typescript meant to be accessed local, remote, offline or online. The work and effort - which was fully invested into OctoFarm by the authors of 3DPF - is now boosted 🚀 for higher code quality 😎 and robustness 💪. The goals are to deliver a much smoother initial setup and 100% clear user experience to ensure you can smash those printing records 🖨️!

Note: our aim is to support all kinds of 3D Printer (FDM, resin) API's with a plugin system and documentation for extensibility. Read more about this in the roadmap section below.

<!--  ![Docker Pulls](https://img.shields.io/docker/pulls/davidzwa/3d-print-farm) -->
<!-- ![GitHub release (latest by date)](https://img.shields.io/github/downloads/davidzwa/3d-print-farm/latest/total) -->

## Stability

This server is currently not yet released, so give it a star ⭐and be the first to experience it! 

#### Last finished: printer file commander and printer location map
#### Current work: printer group, setting and location management

## Development [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/davidzwa/3d-print-farm/graphs/commit-activity) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/davidzwa/3d-print-farm/Node.js%20CI/development) [![GitHub license](https://img.shields.io/github/license/davidzwa/3d-print-farm)](https://github.com/davidzwa/3d-print-farm/blob/master/LICENSE.txt)

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
- Main repository: [https://github.com/davidzwa/3d-print-farm](https://github.com/davidzwa/3d-print-farm)
- Discord: T.B.A.
