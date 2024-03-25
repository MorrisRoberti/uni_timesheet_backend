# Uni Timesheet

> This is an API developed in Typescript with the NestJs framework, which has the purpose of logging the study hours of the day and give some feedback to optimize the time and the outcome of the study itself. This project was born out of my need to organize my study hours in an efficient way + the need to maintain and update my knowledge of the NestJs framework. At the moment is on early stage, I will implement new features when and if I want (I'm very lazy as you can understand reading this doc), but for know this is all you need to know if you want to download this repo.

I'm very far from being a frontend dev, so for now this is just an API, if someone wants to collaborate, please don't hesitate to contact me I would be very happy.  
Thanks and I hope that this doc is not boring as I think :D

## How to download the project

> Once you cloned it on your machine you need to run `npm install` in order to install dependencies

**ATTENTION**

- You need `node` version `v18.10.0`
- You need `docker` version `20.10.17`
- You need `nestjs` version `10.1.12`

## How to run it

### Local/development

- Database -> move to the directory `./docker` and launch the container with `docker-compose up`, in this way the db instance is launched
- Server -> move to `./src` and type the command `npm run start:dev` (the `dev` attribute makes the server reload at any file change)

### Production

The db should already be running, unless I decide to containerize it in production as well, who knows :)  
Fill the `.env.production` file with the db access variables.

- First you need to build the application -> move to `./src` and type `npm run build-production`
- Then you launch it with **pm2** -> type `pm2 start ecosystem.config.js`

This will start the application with **pm2**

## How to test it

At the moment there are no automatized tests, but there is a postman collection file in the `./postman` folder that you can import into the software.
The `/login` api is called automatically in the pre-request scripts of each request for the user `2`

## How to deploy it

Actually there is no practial guide to deploy the application because I still need to make some choices.  
For now just follow the `How to run it/Production` guide.

## Code Structure

**ATTENTION**

> The following may change due to new implementations

I scaffolded the project with a mix of object-based structure and feature-based structure.

In the `docker` folder there is the `docker-compose.yml` file that is the configuration to launch the container and the `init.sql` that is the last dump of the db that docker uses as startup data (volume).

The `logs` folder is self-explanatory, it contains the log files of the application.

In the `postman` folder is contained the json of the Postman collection to test the API.

In the `src` folder we find the following "feature" folders:

- `auth` -> contains the necessary files to manage the autentication
- `config` -> contains the `environment.service.ts` file, actually not used
- `db` -> contains the model definition for the db tables (`sequelize`)
- `endpoints` -> contains the objects, with relative controllers, services etc.
- `error-handling` -> contains the necessary file to manage the errors in an efficient way (models and exception filters)
- `validation` -> contains the DTO validators to do checks on the objects that are sent to the API

There are the environment files: `.env.development` and `.env.production`, this are pretty self explanatory.  
Finally the `ecosystem.config.js` file is a configuration file to launch the program instance with `pm2`.

The other files are the standard files of a Nestjs project.

## Database Entities & Structure

**ATTENTION**

> The following may change due to new implementations

### Entities

- `users` -> self explanatory
- `user_config` -> this is the table that holds additional information for the user
- `subjects` -> this table holds the general subjects that are added from every user
- `user_subjects` -> a record of this table contains the link between the user and one of the subjects
- `hour_logs` -> a record of this table holds the reference to user and user_subject and the hours logged for a specific day
- `weekly_log_table` -> this is an aggregation table that I use to manage weekly log more easily, this makes me able to avoid some heavy queries to the hour_log table

### Structure

At this moment I'm really tired so if you want to see how the tables are related and what constraints there are just check them for yourself in the `./db/models` folder (actually I don't really remember them lol).

## Design Choices

I use the MVC-like pattern suggested by Nestjs, in general there are 3 things for every endpoint:

- `controller.ts` -> contains the entry point for the endpoint, the route, HTTP method etc.
- `dto.ts` -> these are the Data Transfer Objects, they are what the user tipically sends to the endpoint in the body of the request, they contain the definition of the necessary fields, type, validation etc.
- `service.ts` -> this contains both business logic and data logic, I know I should've done two separate providers but this is it, maybe I'll change it later, for now it remains like this; so in general contains the logic to manipulate the objects (dtos and dbentities) and the logic to query the db

The `entities` folder in each endpoint is redundant, I think I'll remove it when the refactor time comes :P.

---

> If the doc is not clear or it's lacking something please open an issue and I'll be happy to update.
