# ---------- Build stage (Debian) ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

ENV npm_config_update_notifier=false
ENV npm_config_fund=false

# Build args for environment variables
ARG VITE_API_BASE_URL=https://bachnvse.me/api
ARG VITE_API_BASE_URL_Not_Api=https://bachnvse.me

# Set environment variables for build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_BASE_URL_Not_Api=${VITE_API_BASE_URL_Not_Api}

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Cài deps (có fallback nếu optional bị lỗi do proxy)
RUN npm ci --include=optional || (rm -f package-lock.json && npm i --include=optional)

# Ép cài native binaries cho nền Debian x64 (glibc)
RUN npm i -D \
  @rollup/rollup-linux-x64-gnu \
  lightningcss-linux-x64-gnu \
  @tailwindcss/oxide-linux-x64-gnu

# Copy source & build
COPY . .
RUN npm run build

# ---------- Runtime ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
