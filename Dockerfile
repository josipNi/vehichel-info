#BUILD STAGE -- we can install everything in here and generate build artifacts.
FROM node:latest As build

WORKDIR /usr/src/app
#Selective copy - see .dockerignore
COPY . .
RUN npm install -g typescript
RUN npm install

RUN npm run build

#PROD STAGE -- copy generated artifacts from build stage and make image out of them
#This ensures minimal image/contaier size
FROM node:latest as prod

ARG NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

# Copy service to fixed location
COPY --from=build /usr/src/app/built /usr/src/app

# default port
EXPOSE 4001

ENTRYPOINT ["node", "main.js"]