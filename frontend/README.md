# ParsePort frontend

NB: this project requires Node <=16 (breaks on 18+).

## Development server

Run `yarn start` for a dev server. Navigate to `http://localhost:4200/`. This will not start the backend, to developing with a functioning backend use `yarn start` from the project root instead. Navigate to `http://localhost:8000/`, which will forward to the frontend.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `yarn build` to build the project. The build artifacts will be stored in the `dist/` directory.

Production Docker builds use the frontend package version by default and record the build time in UTC. To override the version, add `APP_VERSION` to the project root `.env` file:

```properties
APP_VERSION=1.3.0
```

Then build from the project root:

```bash
docker compose --profile prod build ng-prod
```

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
