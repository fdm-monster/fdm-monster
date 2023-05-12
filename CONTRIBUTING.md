# Contributing to FDM Monster

🎉👍 First off, thanks for taking the time to contribute! 👍🎉

The following is a set of guidelines for contributing to FDM Monster and its packages, which are hosted in the [FDM Monster Organization](https://github.com/fdm-monster) on GitHub. These are mostly guidelines, not rules. Use your best judgement, and feel free to propose changes to this document in a pull request.

## Table Of Contents

- [Code of Conduct](#code-of-conduct)
- [Get Started Quickly](#get-started-quickly)
  - [I'm Stuck with a Quick Question!](#im-stuck-with-a-quick-question)
  - [FDM Monster and Packages](#fdm-monster-and-packages)
  - [FDM Monster Design Decisions](#fdm-monster-design-decisions)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)

## Code of Conduct

This project and everyone participating in it is governed by the [FDM Monster Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [davidzwa@gmail.com](mailto:davidzwa@gmail.com).

## Get Started Quickly

### I'm Stuck with a Quick Question!

Sorry, we do not have documentation with F.A.Q. yet. Please visit us on Discord instead! Our Github repo is not the place for support questions. Find the link in [README.md - contact](README.md#contact).

### FDM Monster and Packages

FDM Monster currently consists of two active repositories:

- [FDM Monster](https://github.com/fdm-monster/fdm-monster): the server and client packed together as one
- [FDM Connector](https://github.com/fdm-monster/fdm-connector): the OctoPrint plugin ⚠️(not in use)

### FDM Monster Design Decisions

#### Server design

- **FDM Monster server** was chosen to be a NodeJS server. The backend is currently structured as a REST API. It might be surprising that we use `awilix` as Inversion-of-Control implementation, but if you study the resulting architecture, it will show its fresh and quick-to-develop benefits rapidly.
- **FDM Monster server** runs using MongoDB as a database and Mongoose as ORM.
- **FDM Monster server** caches data in-memory using a self-written store/cache system between the database (no redis!).
- **FDM Monster server** API is built up using `awilix-express` and uses `node-input-validation` as API validation.
- **FDM Monster server** is equipped with a task scheduler (ToadScheduler) which gives the capability to run workloads in the background.

#### Client design

- Its web client is written using Typescript and Vue2.
- We intend to switch to Vue3 once Vuetify3 is released and stable.
- Vuetify is currently the package for Material UI and components.
- We use vue-class-component for maintaining class Vue components.
- Vuex serves as store and state management.

Are you missing specific details here? Do create a Pull-Request.


### Your First Code Contribution

Unsure where to begin contributing to FDM Monster? You can start by looking through these beginner and help-wanted issues:

- [Beginner issues](https://github.com/fdm-monster/fdm-monster/labels/good%20first%20issue)
- [Help wanted issues](https://github.com/fdm-monster/fdm-monster/labels/help%20wanted)

### Pull Requests

The process described here has several goals:

- Maintain code quality
- Fix problems that are important to users
- Engage the community in working toward the best possible FDM Monster codebase
- Enable a sustainable system for FDM Monster's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Follow the [guidelines for contributing](#contributing-to-fdm-monster).
2. Fork the [repository](https://github.com/fdm-monster/fdm-monster) and create your branch from `main`.
3. Make changes in your branch.
4. If you've added code that should be tested, add tests.
5. If you've changed APIs, update the documentation.
6. Ensure the test suite passes (`npm run test`). Tip: `npm run test:watch` is great for this.
7. Make sure your code lints (`npm run lint`).
8. Create a pull request.

## License

By contributing to FDM Monster, you agree that your contributions will be licensed under its MIT license.
