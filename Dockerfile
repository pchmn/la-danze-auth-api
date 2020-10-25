FROM node:14.14-alpine

ARG NODE_ENV

ENV NODE_ENV=$NODE_ENV

ENV PORT=3010

COPY dist/ ./dist

COPY package.json .

COPY node_modules ./node_modules

EXPOSE 3010

CMD npm run start:prod