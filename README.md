# ParsePort

[![Actions Status](https://github.com/UUDigitalHumanitieslab/parseport/workflows/Unit%20tests/badge.svg)](https://github.com/UUDigitalHumanitieslab/parseport/actions)

ParsePort is a web interface for two NLP-related (natural language processing) parsers and two associated pre-parsed text corpora, both developed at Utrecht University.

1. The [Spindle](https://github.com/konstantinosKokos/spindle) parser is used to produce type-logical parses of Dutch sentences. It features a pre-parsed corpus of around 65.000 sentences (based on [Lassy Small](https://taalmaterialen.ivdnt.org/download/lassy-klein-corpus6/)) called [Æthel](https://github.com/konstantinosKokos/aethel). These tools have been developed by dr. Konstantinos Kogkalidis as part of a research project conducted with prof. dr. Michaël Moortgat at Utrecht University.

2. The Minimalist Parser produces syntactic tree models of English sentences based on user input, creating syntax trees in the style of [Chomskyan Minimalist Grammar](https://en.wikipedia.org/wiki/Minimalist_program). The parser has been developed by dr. Meaghan Fowlie at Utrecht University and comes with a pre-parsed corpus of 100 sentences taken from the Wall Street Journal. The tool used to visualize these syntax trees in an interactive way is Vulcan, developed by dr. Jonas Groschwitz, also at Utrecht University.

## Running this application in Docker

In order to run this application you need a working installation of Docker and an internet connection. You will also need the source code from four other repositories. These must be located in the same directory as the `parseport` source code.

1. [`spindle-server`](https://github.com/CentreForDigitalHumanities/spindle-server) hosts the source code for a server with the Spindle parser;
2. [`latex-service`](https://github.com/CentreForDigitalHumanities/latex-service) contains a LaTeX compiler that is used to export the Spindle parse results in PDF format;
3. [`mg-parser-server`](https://github.com/CentreForDigitalHumanities/mg-parser-server) has the source code for the Minimalist Grammar parser;
4. [`vulcan-parseport`](https://github.com/CentreForDigitalHumanities/vulcan-parseport) is needed for the websocket-based webserver that hosts Vulcan, the visualization tool for MGParser parse results.

See the instructions in the README files of these repositories for more information on these codebases.

In addition, you need to add a configuration file named `.env` to the root directory of this project with at least the following setting.

```conf
DJANGO_SECRET_KEY=...
```

In overview, your file structure should be as follows.

```
┌── parseport (this project)
|   ├── compose.yaml
|   ├── .env
|   ├── frontend
|   |   └── Dockerfile
|   └── backend
|       ├── Dockerfile
|       └── aethel_db
|           └── data
|               └── aethel.pickle
|
├── spindle-server
|   ├── Dockerfile
|   └── model_weights.pt
|
├── latex-service
|   └── Dockerfile
|
├── mg-parser-server
|   └── Dockerfile
|
└── vulcan-parseport
    ├── Dockerfile
    └── app
        └── standard.pickle
```

Note that you will need three data files in order to run this project.

- `model_weights.pt` should be put in the root directory of the `spindle-server` project. It can be downloaded from _Yoda-link here_.
- `aethel.pickle` contains the pre-parsed data for Æthel and should live at `parseport/backend/aethel_db/data`. You can find it in the zip archive [here](https://github.com/konstantinosKokos/aethel/tree/stable/data).
- `standard.pickle` contains the pre-parsed corpus for the Minimalist Parser. It should be placed in the `vulcan-parseport/app` directory. You can download it from _Yoda-link here_.

This application can be run in both `production` and `development` mode. Either mode will start a network of seven containers.

| Name              | Description                                       |
|-------------------|---------------------------------------------------|
| `nginx`           | Entry point and reverse proxy, exposes port 5000. |
| `pp-ng`           | The frontend server (Angular).                    |
| `pp-dj`           | The backend/API server (Django).                  |
| `pp-spindle`      | The server hosting the Spindle parser.            |
| `pp-latex`        | The server hosting a LaTeX compiler.              |
| `pp-mg-parser`    | The server hosting the Minimalist Grammar parser. |
| `pp-vulcan`       | The server hosting the Vulcan visualization tool. |

Start the Docker network in **development mode** by running the following command in your terminal.

```
docker compose --profile dev up --build -d
```

For **production mode**, run the following instead.

```
docker compose --profile prod up --build -d
```

The Spindle server needs to download several files before the parser is ready to receive input. You should wait a few minutes until the message *App is ready!* appears in the Spindle container logs.

Open your browser and visit your project at http://localhost:5000 to view the application.

## Preparing for development

Note that the Aethel dataset will be loaded in every time the backend server restarts. To avoid slow feedback loops in a development environment, consider running `python manage.py create_aethel_subset` before starting the development server. This will take create a much smaller subset that takes less than a second to load.


## Before you start

You need to install the following software:

-   PostgreSQL >= 10, client, server and C libraries
-   Python >= 3.8, <= 3.10
-   virtualenv
-   WSGI-compatible webserver (deployment only)
-   [Visual C++ for Python][1] (Windows only)
-   Node.js >= 14.20.0
-   Yarn
-   [WebDriver][2] for at least one browser (only for functional testing)

[1]: https://wiki.python.org/moin/WindowsCompilers
[2]: https://pypi.org/project/selenium/#drivers

## How it works

This project integrates three isolated subprojects, each inside its own subdirectory with its own code, package dependencies and tests:

-   **backend**: the server side web application based on [Django][3] and [DRF][4]

-   **frontend**: the client side web application based on [Angular](https://angular.io)

-   **functional-tests**: the functional test suite based on [Selenium][6] and [pytest][7]

[3]: https://www.djangoproject.com
[4]: https://www.django-rest-framework.org
[6]: https://www.selenium.dev/documentation/webdriver/
[7]: https://docs.pytest.org/en/latest/

Each subproject is configurable from the outside. Integration is achieved using "magic configuration" which is contained inside the root directory together with this README. In this way, the subprojects can stay truly isolated from each other.

If you are reading this README, you'll likely be working with the integrated project as a whole rather than with one of the subprojects in isolation. In this case, this README should be your primary source of information on how to develop or deploy the project. However, we recommend that you also read the "How it works" section in the README of each subproject.

## Development

### Quickstart

First time after cloning this project:

```console
$ python bootstrap.py
```

Running the application in [development mode][8] (hit ctrl-C to stop):

```console
$ yarn start
```

This will run the backend and frontend applications, as well as their unittests, and watch all source files for changes. You can visit the frontend on http://localhost:8000/, the browsable backend API on http://localhost:8000/api/ and the backend admin on http://localhost:8000/admin/. On every change, unittests rerun, frontend code rebuilds and open browser tabs refresh automatically (livereload).

[8]: #development-mode-vs-production-mode

### Recommended order of development

For each new feature, we suggested that you work through the steps listed below. This could be called a back-to-front or "bottom up" order. Of course, you may have reasons to choose otherwise. For example, if very precise specifications are provided, you could move step 8 to the front for a more test-driven approach.

Steps 1–5 also include updating the unittests. Only functions should be tested, especially critical and nontrivial ones.

1.  Backend model changes including migrations.
2.  Backend serializer changes and backend admin changes.
3.  Backend API endpoint changes.
4.  Frontend model changes.
5.  Other frontend unit changes (templates, views, routers, FSMs).
6.  Frontend integration (globals, event bindings).
7.  Run functional tests, repair broken functionality and broken tests.
8.  [Add functional tests][9] for the new feature.
9.  Update technical documentation.

[9]: functional-tests/README.md#writing-tests

For release branches, we suggest the following checklist.

1.  Bump the version number in the `package.json` next to this README.
2.  Run the functional tests in production mode, fix bugs if necessary.
3.  Try using the application in production mode, look for problems that may have escaped the tests.
4.  Add regression tests (unit or functional) that detect problems from step 3.
5.  Work on the code until new regression tests from step 4 pass.
6.  Optionally, repeat steps 2–5 with the application running in a real deployment setup (see [Deployment](#deployment)).

### Commands for common tasks

The `package.json` next to this README defines several shortcut commands to help streamline development. In total, there are over 30 commands. Most may be regarded as implementation details of other commands, although each command could be used directly. Below, we discuss the commands that are most likely to be useful to you. For full details, consult the `package.json`.

Install the pinned versions of all package dependencies in all subprojects:

```console
$ yarn
```

Run backend and frontend in [production mode][8]:

```console
$ yarn start-p
```

Run the functional test suite:

```console
$ yarn test-func [FUNCTIONAL TEST OPTIONS]
```

The functional test suite by default assumes that you have the application running locally in production mode (i.e., on port `4200`). See [Configuring the browsers][10] and [Configuring the base address][11] in `functional-tests/README` for options.

[10]: functional-tests/README.md#configuring-the-browsers
[11]: functional-tests/README.md#configuring-the-base-address

Run _all_ tests (mostly useful for continuous integration):

```console
$ yarn test [FUNCTIONAL TEST OPTIONS]
```

Run an arbitrary command from within the root of a subproject:

```console
$ yarn back  [ARBITRARY BACKEND COMMAND HERE]
$ yarn front [ARBITRARY FRONTEND COMMAND HERE]
$ yarn func  [ARBITRARY FUNCTIONAL TESTS COMMAND HERE]
```

For example,

```console
$ yarn back less README.md
```

is equivalent to

```console
$ cd backend
$ less README.md
$ cd ..
```

Run `python manage.py` within the `backend` directory:

```console
$ yarn django [SUBCOMMAND] [OPTIONS]
```

`yarn django` is a shorthand for `yarn back python manage.py`. This command is useful for managing database migrations, among other things.

Manage the frontend package dependencies:

```console
$ yarn fyarn (add|remove|upgrade|...) (PACKAGE ...) [OPTIONS]
```

### Notes on Python package dependencies

Both the backend and the functional test suite are Python-based and package versions are pinned using [pip-tools][13] in both subprojects. For ease of development, you most likely want to use the same virtualenv for both and this is also what the `bootstrap.py` assumes.

[13]: https://pypi.org/project/pip-tools/

This comes with a small catch: the subprojects each have their own separate `requirements.txt`. If you run `pip-sync` in one subproject, the dependencies of the other will be uninstalled. In order to avoid this, you run `pip install -r requirements.txt` instead. The `yarn` command does this correctly by default.

Another thing to be aware of, is that `pip-compile` takes the old contents of your `requirements.txt` into account when building the new version based on your `requirements.in`. You can use the following trick to keep the requirements in both projects aligned so the versions of common packages don't conflict:

```console
$ yarn back pip-compile
# append contents of backend/requirements.txt to functional-tests/requirements.txt
$ yarn func pip-compile
```

### Development mode vs production mode

The purpose of development mode is to facilitate live development, as the name implies. The purpose of production mode is to simulate deployment conditions as closely as possible, in order to check whether everything still works under such conditions. A complete overview of the differences is given below.

| dimension                     | Development mode                            | Production mode                             |
| ----------------------------- | ------------------------------------------- | ------------------------------------------- |
| command                       | `yarn start`                                | `yarn start-p`                              |
| base address                  | http://localhost:8000                       | http://localhost:4200                       |
| backend server (Django)       | in charge of everything                     | serves backend only                         |
| frontend server (angular-cli) | serves                                      | watch and build                             |
| static files                  | served directly by Django's staticfiles app | collected by Django, served by gulp-connect |
| backend `DEBUG` setting       | `True`                                      | `False`                                     |
| backend `ALLOWED_HOSTS`       | -                                           | restricted to `localhost`                   |
| frontend sourcemaps           | yes                                         | no                                          |
| frontend optimization         | no                                          | yes                                         |

## Deployment

Both the backend and frontend applications have a section dedicated to deployment in their own READMEs. You should read these sections entirely before proceeding. All instructions in these sections still apply, though it is good to know that you can use the following shorthand commands from the integrated project root:

```console

# collect static files of both backend and frontend, with overridden settings
$ yarn django collectstatic --settings SETTINGS --pythonpath path/to/SETTINGS.py
```

You should build the frontend before collecting all static files.
