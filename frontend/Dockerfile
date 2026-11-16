# Build the Angular production bundle
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve static files via Nginx
FROM nginx:alpine
COPY --from=build /app/dist/nl-express-ui/browser /usr/share/nginx/html
EXPOSE 80
