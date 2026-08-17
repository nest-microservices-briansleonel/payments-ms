FROM node:24.18-alpine3.23

WORKDIR /usr/src/app

RUN npm install -g pnpm@11.9.0

COPY package.json pnpm-lock.yaml ./

RUN printf "allowBuilds:\n  unrs-resolver: true\n" > pnpm-workspace.yaml \
    && pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000