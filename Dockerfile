# Stage 1: Build do React
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Servir com Nginx
FROM nginx:alpine

# Copia o build para o Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta interna do container (não precisa ser a mesma do host)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
