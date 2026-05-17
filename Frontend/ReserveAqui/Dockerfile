FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências com cache
COPY package*.json ./
RUN npm ci

# Copia o restante do código e gera build de produção
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner

# Copia build estático para o nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
