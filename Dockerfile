FROM node:7.6.0

RUN mkdir -p /usr/src/app/
COPY src/ /usr/src/app/

WORKDIR /usr/src/app/
RUN npm install

EXPOSE 1337
CMD [ "npm", "start" ]