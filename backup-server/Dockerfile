FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev \
    && apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

COPY . .
RUN chown -R node:node /app

EXPOSE 3003

USER node
CMD [ "node", "index.js" ]
