# PugTube
[![Backend Compliance CI](https://github.com/sicksid/pugtube/actions/workflows/backend.yml/badge.svg?branch=main&event=push)](https://github.com/sicksid/pugtube/actions/workflows/backend.yml)
[![Webapp Compliance CI](https://github.com/sicksid/pugtube/actions/workflows/frontend.yml/badge.svg?branch=main&event=push)](https://github.com/sicksid/pugtube/actions/workflows/frontend.yml)

A video sharing service built with Django and Next.js

## Features
- User registration and authentication
- Video upload and streaming
- Commenting system
- Like and dislike system

## Installation

This project uses `http://taskfile.dev` and Docker to manage tasks and dependencies. To manage the project dependencies this project uses `pdm` from `http://pdm.fming.dev` and `npm` from `https://www.npmjs.com`

To set up the project, you need to have Docker installed on your machine. You should also check the `.tool-versions` file to make sure you have the correct versions of languages installed.
You can use `asdf` to install the correct versions of languages and their respective dependencies by visiting the official website `http://asdf-vm.com`

Once you have Docker set up, you can use the following command to start the project:

```bash
task dev
```

This command starts all the services in the `docker-compose.yml` file and prints logs, which is ideal for local development. this is also the default task file, so you can also just run `task` to get the same results
You can also use the following command to build all the containers for the project:

```bash
task build
```

### Deployment

The project is deployed using `flightcontrol.dev` which is a great way to have your own custom Vercel or Heroku but running in your own AWS account.
Production website is http://www.pugtube.dev or http://pugtube.dev and the api is http://api.pugtube.dev

## Available tasks

* `api.migrate`: Runs migrations for api locally
* `build`: Builds all containers(api, web)
* `build.api`: Builds api container
* `build.web`: Builds web container
* `build.web.local`: Builds web locally
* `cd.api`: Changes directory to api
* `cd.web`: Changes directory to web
* `ci.pr`: Runs github actions locally as if it was a pull request
* `ci.push`: Runs github actions locally as if it was pushed to the repo
* `compose.build`: Builds all services in docker-compose.yml
* `compose.down`: Stops all services in docker-compose.yml
* `compose.logs`: Shows logs for all services in docker-compose.yml
* `compose.up`: Starts all services in docker-compose.yml
* `dev`: Starts all services in docker-compose.yml and prints logs, ideal for local development
* `docker.start`: Starts Docker engine locally
* `logs`: Shows logs for all services in docker-compose.yml
* `run.api`: Runs api container
* `run.web`: Runs web container
* `start.api`: Starts api locally
* `start.web`: Starts web locally

### Note
This project also uses [Prefect](https://prefect.io) to run workflows for encoding and decoding video and making screenshots and subtitles. Prefect describes itself as an "Orchestration and observation platform for modern data workflows", serving as a centralized system for scheduling, monitoring, and maintaining your workflows, similar to an air traffic control for your data.
Additionally, the team is planning to add [Spacy](https://spacy.io) to add AI automated workflows along with prefect.

## Contribution
If you want to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

## Licensing
The code in this project is licensed under the AGPL-3.0 license.
