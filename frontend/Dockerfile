# syntax=docker/dockerfile:1

FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
# pnpm is installed at the version package.json pins, so the two never drift.
RUN npm install --global "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1].split('+')[0]")"
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

# Local development (docker-compose.yaml): the Vite dev server. Not an image to ship.
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0"]

# nginx-unprivileged runs as the `nginx` user (uid 101) and listens on 8080.
FROM nginxinc/nginx-unprivileged:alpine AS runtime
USER root
RUN apk upgrade --no-cache
# nginx fills in the variables of the templates at start: the backend address is the deployment's, not the image's.
ENV BACKEND_URL=http://backend:8000
COPY --chown=nginx:nginx docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chown=nginx:nginx --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
