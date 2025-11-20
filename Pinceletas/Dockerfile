# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build para producción
RUN npm run build -- --configuration production

# Etapa 2: Runtime con Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remover contenido por defecto de nginx
RUN rm -rf ./*

# Copiar build de Angular
COPY --from=build /app/dist/pinceletas/browser .

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]