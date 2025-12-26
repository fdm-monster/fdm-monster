# Contributing to FDM Monster

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing to FDM Monster and its packages, which are hosted in the [FDM Monster Organization](https://github.com/fdm-monster) on GitHub. These are mostly guidelines, not rules. Use your best judgement, and feel free to propose changes to this document in a pull request.

#### Table Of Contents

[Code of Conduct](#code-of-conduct)

[Get Started Quickly](#get-started-quickly)

- [Im Stuck with a quick question!](#im-stuck-with-a-quick-question)
- [FDM Monster and Packages](#fdm-monster-and-packages)
- [FDM Monster Design Decisions](#design-decisions)

[How Can I Contribute?](#how-can-i-contribute)

- [Reporting Bugs](#reporting-bugs)
- [Your First Code Contribution](#your-first-code-contribution)
- [Pull Requests](#pull-requests)

## Code of Conduct

This project and everyone participating in it is governed by the [FDM Monster Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [davidzwa@gmail.com](mailto:davidzwa@gmail.com).

## Get Started Quickly

### Im Stuck with a quick question!

Sorry we do not have a documentation with F.A.Q. yet. Please visit us on discord instead! Our GitHub repo is not the place for support questions. Find the link in [README.md - contact](README.md#contact).

### FDM Monster and packages

FDM Monster currently consists of two active repositories:

- [FDM Monster](https://github.com/fdm-monster/fdm-monster) - the server
- [FDM Monster Client](https://github.com/fdm-monster/fdm-monster-client) - the client UI
- [FDM Connector](https://github.com/fdm-monster/fdm-connector) - the OctoPrint plugin (not in use yet)

### Design decisions

Server design

- **FDM Monster server** was chosen to be a Node.js server. The backend is currently structured as a REST API. It might be surprising that we use `awilix` as Inversion-of-Control implementation, but if you study the resulting architecture it will show its fresh and quick-to-develop benefits rapidly.
- **FDM Monster server** runs using Sqlite as database and Typeorm as ORM
- **FDM Monster server** caches data in-memory using a self-written store/cache system between the database (no redis!)
- **FDM Monster server** API is built up using `awilix-express` and uses `node-input-validation` as API validation
- **FDM Monster server** is equipped with a task scheduler (ToadScheduler) which gives the capability to run workloads in the background.

Client design

- Its web client is written using Typescript and Vue2
- We intend to switch to Vue3 once Vuetify3 is released and stable
- Vuetify is currently the package for Material UI and components
- Pinia serves as store and state management

Are you missing specific details here? Do create a Pull-Request.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for FDM Monster. Following these guidelines helps maintainers and the community understand your report :pencil:, reproduce the behavior :computer: :computer:, and find related reports :mag_right:.

Before creating bug reports, please check [this list](#before-submitting-a-bug-report) as you might find out that you don't need to create one. When you are creating a bug report, please [include as many details as possible](#how-do-i-submit-a-good-bug-report). Fill out [the required template](https://github.com/fdm-monster/.github/blob/development/.github/ISSUE_TEMPLATE/bug_report.md), the information it asks for helps us resolve issues faster.

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

#### Before Submitting A Bug Report

- You might need to find the cause of the problem by debugging and fix things yourself. Most importantly, check if you can reproduce the problem in the latest version of FDM Monster which is always on the `main` branch of github
- **Check the [discussions](https://github.com/fdm-monster/fdm-monster/discussions)** for a list of common questions and problems.
- **Perform a [cursory search](https://github.com/search?q=+is%3Aissue+user%3Afdm-monster)** to see if the problem has already been reported. If it has **and the issue is still open**, add a comment to the existing issue instead of opening a new one.

#### How Do I Submit A (Good) Bug Report?

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). After you've determined [which repository](#fdm-monster-and-packages) your bug is related to, create an issue on that repository and provide the problem reproduction.

Explain the problem and include additional details to help maintainers reproduce the problem:

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as many details as possible. For example, start by explaining how you started FDM Monster, e.g. which command exactly you used to install it or start it, or how you started FDM Monster otherwise. When listing steps, **don't just say what you did, but explain how you did it**. For example, if you added an OctoPrint printer where did you get the URL for the OctoPrint server and which place did you get the API Key to make FDM Monster access you OctoPrint Server?
- **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples. If you're providing snippets in the issue, use [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines).
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem. You can use [OBS Studio](https://obsproject.com/) to capture the screen or you can use [this tool](https://www.cockos.com/licecap/) to record GIFs on macOS and Windows.
- **If you're reporting that FDM Monster crashed**, include the `logs` subfolder contents (note that this might contain privacy-sensitive information).
- **If the problem is related to performance, responsiveness/sluggishness or memory**, include a CPU/RAM usage screenshot with your report (Task Manager, htop, etc.).
- **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened and what action you think might have caused this.

### Your First Code Contribution

You might be delighted to know that the FDM Monster server was structured consistently for other developers to be able to work with it rapidly.

1. Clone the repository from the development branch (git clone https://github.com/fdm-monster/fdm-monster.git)
2. Ensure Node (v24) is installed
3. Adjust/create a `.env` with NODE_ENV=development **inside the server folder**
4. `npm install` **inside the server folder** to create the `node_modules` folder
5. Run the server with `npm run dev` to let nodemon detect and apply any changes you make

Please make sure you understand the meaning of these files/folders:

- package.json
- index.mjs
- container.js // container.tokens.js
- server.core.js // server.host.js
- tasks.js // tasks/... // tasks/boot.task.js
- server.constants.js
- constants
- controllers (API)
- entities (typeorm)
- exceptions
- handlers
- middleware
- migrations (typeorm/sqlite)
- services // services/octoprint/...
- state // state/printer.state.js // state/files.store.js // state/data/...
- tasks // tasks/boot.task.js // printer-websocket.task.js
- test
- utils

Please make sure you understand how to write tests. Take `user-controller.test.js` as template to get started with API tests.
Take `user-service.test.js` as template to get started with application/domain tests.

### Pull Requests

1. You'll fork the repository (skip this if you're a direct FMD Monster contributor)
2. You'll made the changes and committed the changes in a branch of your fork according to [gitflow standard](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
3. You'll make a pull-request from your fork to development (See example here: https://github.com/fdm-monster/fdm-monster/compare)
4. All required GitHub Actions have completed successfully - you understand that as a fork not all actions may complete due to security
5. You'll await pull-request approval of a FDM Monster owner

If all goes well you're changes will be released to FDM Monster.
