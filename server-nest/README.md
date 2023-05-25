<p align="center" style="margin-bottom: 0">
    <a href="https://docs.fdm-monster.net/" target="_blank" rel="noopener noreferrer">
        <img width="150" src="../docs/images/logo-copyright.png" alt="FDM Monster">
    </a>
</p>
<h1 align="center" style="padding-top: 0; margin-top: 10px">FDM Monster</h1>

<p align="center">
<a href="https://github.com/fdm-monster/fdm-monster/releases/latest">
    <img src="https://img.shields.io/github/release/fdm-monster/fdm-monster"/>
</a>
<a href="https://github.com/fdm-monster/fdm-monster/stargazers">
    <img src="https://img.shields.io/github/stars/fdm-monster/fdmonster"/>
</a>
<a href="https://github.com/fdm-monster/fdm-monster/issues">
    <img src="https://img.shields.io/github/issues/fdm-monster/fdm-monster"/>
</a>

</p>
<h2 align="center">
<a href="https://docs.fdm-monster.net/" target="_blank">Documentation</a>
</h2>

## What is FDM Monster V2?

FDM Monster V2 is the next-gen of FDM Monster written in NestJS. 

## Why FDM Monster V2?

NestJS allows me to focus on the business logic and not on the boilerplate code.
It also allows me to write unit tests and e2e tests easily. 
Finally, because it's written in TypeScript, it's easier to maintain and to understand.

## What stack will it use?

- [NestJS](https://nestjs.com/) >= 9.0.0
- [TypeScript](https://www.typescriptlang.org/) >= 5.0.0
- [PostgreSQL](https://www.postgresql.org/) >= 13.0

## How to use it?

You can use it as a standalone application (future: also as a docker container).
As this project is still in development, we do not expect you to run it in production,
and we will support it only once it has been released.

### Prerequisites

- [Node.js](https://nodejs.org/en/) >= 16.0.0
- [Yarn](https://yarnpkg.com/) >= 1.22.0
- [PostgreSQL](https://www.postgresql.org/) >= 13.0
- (Optional) [Docker](https://www.docker.com/) >= 20.10.0
- (Optional) [Docker Compose](https://docs.docker.com/compose/) >= 1.28.0
- (Future) [Redis](https://redis.io/) >= 6.0.0
- (Future) [Mosquitto](https://mosquitto.org/) >= 2.0.0
- (Future) [FDM Connector](https://github.comf/fdm-monster/fdm-connector) >= 1.0.0
