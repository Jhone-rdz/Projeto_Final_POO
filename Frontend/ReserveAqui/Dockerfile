FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM alpine:3.20
WORKDIR /export

COPY --from=builder /app/dist /build

CMD ["sh", "-c", "rm -rf /frontend-dist/* && cp -r /build/* /frontend-dist && echo Frontend_build_ready"]
