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

I scaffolded the project with a mix of object-based structure and feature-based structure.

In the `docker` folder there is the `

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
