FROM node:9-alpine

WORKDIR /usr/app/src

COPY ./package.json ./yarn.lock /usr/app/src/

RUN yarn install \
	&& yarn build

COPY ./dist /usr/app/src/

EXPOSE 3000

CMD ["npm","start"]
