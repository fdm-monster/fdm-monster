# FDM Monster [![GitHub stars](https://img.shields.io/github/stars/fdm-monster/fdmonster)](https://github.com/fdm-monster/fdmonster/stargazers) ![GitHub issues](https://img.shields.io/github/issues/fdm-monster/fdmonster?color=green) [![GitHub forks](https://img.shields.io/github/forks/fdm-monster/fdmonster)](https://github.com/fdm-monster/fdmonster/network) [![Latest Release](https://img.shields.io/github/release/fdm-monster/fdmonster)](https://img.shields.io/github/v/tag/fdm-monster/fdmonster?sort=date) ![Coverage](https://img.shields.io/codecov/c/github/fdm-monster/fdmonster?color=green)

**_The server for managing 3D printers with great overview_**

FDM Monster is a bulk OctoPrint manager and dashboard written in Vue with Typescript meant to be accessed local, remote, offline or online. This project has a different approach to farm management than normal - it actually scales for bigger farms (50-100). We therefore aim 🚀 for high code quality 😎 and robustness all around 💪. The goals are to deliver a smooth initial setup and 100% clear user experience to ensure you can smash those printing records 🖨️!

Note: our aim is to support all kinds of 3D Printer (FDM, resin) API's with a plugin system and documentation for extensibility - in the future. Read more about this in the roadmap section below.

**What we dont aim for**
We dont aim to provide webcam support right now as this is one of the big bottlenecks for stable server performance. This might change once the developers of FDM Monster have the plugin system tested and working.

<!--  ![Docker Pulls](https://img.shields.io/docker/pulls/fdm-monster/fdmonster) -->
<!-- ![GitHub release (latest by date)](https://img.shields.io/github/downloads/fdm-monster/fdmonster/latest/total) -->

## Stability

This server is currently freshly released, so give it a star ⭐and be the first to experience it! 

#### Last finished features: printer group, setting and location management
#### Current work: auto-clean OctoPrint files with different settings

## Development [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://gitHub.com/fdm-monster/fdmonster/graphs/commit-activity) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/fdm-monster/fdmonster/Node.js%20CI/development) [![GitHub license](https://img.shields.io/github/license/fdm-monster/fdmonster)](https://github.com/fdm-monster/fdmonster/blob/master/LICENSE.txt)

This work is under active development with cutting edge tech and standards. Feel like joining in? Your options are to create a pull-request, send an email, or open a discussion!

## Roadmap

- [x] :rocket: Vue app core and distribution setup on NPM completed
- [x] :rocket: Client for basic management of OctoPrint printers (file storage, print upload and printer management)
- [x] 🌟 Printer Location Map based on 2x2 groups
- [x] 🛡️ Server resilient against database connection failures with automatic retry of 5 seconds
- [x] 🔌 FDM Monster Connector (OctoPrint Plugin) prerelease 0.1.0 ([find it here](https://gitHub.com/fdm-monster/fdm-connector/releases))
- [x] 🛡️ Better authentication and authorization mechanisms
- [x] :rocket: Docker multi-arch image (arm/v7, arm64 and amd64 architectures => Raspberry Pi with an 64 bits OS!)
- [x] :rocket: Printer Group management
- [x] 🛡️ MongoDB 5 support
- [x] :rocket: First core release tested in the field
- [ ] 🛡️ NodeJS Server legacy-free (history, alerts, custom gcode and filament)
- [ ] 🛡️ Frontend user and basic role management
- [ ] 🛡️ Full API and client test coverage >80% (now at 60%) 
- [ ] 🔌 FDM Connector - filament tracker 
- [ ] 🔌 Raspberry Pi image and prebuilt customized OctoPi image
- [ ] :rocket: Chocolatey package (Windows install)
- [ ] :rocket: Documentation
- [ ] :rocket: Plugin system (preparation work is ready)
- [ ] :rocket: Docker overlay as service management (daemonized restart & auto-updates)
- [ ] :rocket: .NET 6 cross-platform daemon (drop necessity of pm2)
- [ ] Support for OctoPrint 2.0.0 (when it comes out)
- [ ] More to be found here https://github.com/fdm-monster/fdmonster/discussions/48

There are a lot of plans in the making (f.e. tunneling, auto-discovery, plugin system,  etc.), which will be announced as we go!

## License
Distributed under GNU Affero General Public License v3.0. See `LICENSE` for more information.

## Contact
- Main repository: [https://github.com/fdm-monster/fdmonster](https://github.com/fdm-monster/fdmonster)
- Discord: [The Hub](https://discord.gg/mwA8uP8CMc)

Please join the discord, but stay professional and proactive!
> "You give some, you take some."
