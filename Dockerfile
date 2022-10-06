FROM node:16-alpine

WORKDIR /plugin

COPY . /plugin

ENV NODE_ENV production

RUN npm ci

CMD ["node:", "/plugin/index.js"]
