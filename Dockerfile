FROM node:14.1.0-slim

# reference: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker
RUN apt-get update \
 && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends

 # non-root user that comes with `node` images.
USER node

WORKDIR /app

COPY --chown=node package.json .
COPY --chown=node package-lock.json .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

RUN npm install

COPY --chown=node . /app

CMD npm run dev