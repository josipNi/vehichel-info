# NodeJs Test Assignment

## Using NodeJs, typescript, express and mongoDb

### You need to install the following

- [NodeJs LTS](https://nodejs.org/en/)
- [MongoDb](https://docs.mongodb.com/manual/installation/)

**Running in development**

- `npm install `
- `npm start`

**Running in container**

- `docker-compose build`
- `docker-compose up`

**Building the docker image for node**

- `docker build .`
- `docker run <image_hash>`

**Running tests**

- `npm test`

---

## Database choice

For this demo project I have decided to use mongo db with mongoose orm, the main reason being my experience in this specific ecosystem for the past 8 months

In other ecosystems I prefer to use relational databases(postgre, mssql, ect..) mainly because I consider them more matured, they also provide a reliable database structure

In cases where I would need fast document access with a flexible schema, which would enable the user to define his own database model I would use mongo
