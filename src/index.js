'use strict';
const express = require('express');
const spdy = require('spdy');
const fs = require('fs');
const path = require('path');
const url = require('url');
const port = process.env.PORT || 1337;
const staticContentDirectory = 'static';
const app = express();
const options = {
    key: fs.readFileSync(__dirname + '/server.key'),
    cert:  fs.readFileSync(__dirname + '/server.crt')
}

const staticContent = [
    `/${staticContentDirectory}/css/style0.css`,
    `/${staticContentDirectory}/css/style1.css`,
    `/${staticContentDirectory}/css/style2.css`,
    `/${staticContentDirectory}/js/js0.js`,
    `/${staticContentDirectory}/js/js1.js`,
    `/${staticContentDirectory}/js/js2.js`,
    `/${staticContentDirectory}/images/img0.jpg`,
    `/${staticContentDirectory}/images/img1.jpg`,
    `/${staticContentDirectory}/images/img2.jpg`
  ];
const files = {};
files['index.html'] = staticContent;

app.use((request, response, next) => {
  const resourceName = getResourceName(request);

  console.log('Request for: ', resourceName);

  const subResources = files[resourceName];

  return pushSubResources(subResources, response)
    .then(() => {
      response.writeHead(200);
      return readResource(`${staticContentDirectory}/${resourceName}`).then(r => response.end(r.data));
  }).catch(console.log);
});

spdy
  .createServer(options, app)
  .listen(port, (error) => {
    if (error) {
      console.error(error);
      return process.exit(1);
    }
    console.log(`server running on port: ${port}`);
  });

function pushSubResources(subResources, response) {
  if (subResources) {
    return Promise.all(subResources.map(readResource))
    .then(resources => {
      resources.forEach(resource => {
        const contentType = guessContentType(resource.name);
        const stream = response.push(resource.name, {
          response: {
            'Content-Type': contentType
          }
        });
        stream.on('error', console.log);
        stream.end(resource.data);
      });
    });
  }

  return Promise.resolve();
}

function readResource(resourceName) {
  const resourcePath = path.join(__dirname, resourceName);

  return new Promise((resolve, reject) => {
    fs.readFile(resourcePath, (error, data) => {
      if (error) {
        return reject(error);
      }

      return resolve({
        'name': resourceName,
        'data': data
      });
    });
  });
}

function guessContentType(resource) {
  if (resource.endsWith('jpg')) return 'image/jpeg';
  if (resource.endsWith('css')) return 'text/css';
  if (resource.endsWith('js')) return 'application/javascript';
  return 'text/plain';
}

function getResourceName(request) {
  const resourceName = url.parse(request.url).pathname.substr(1);

  if (resourceName === '' || resourceName === '/') {
    return 'index.html';
  }

  return resourceName;
}