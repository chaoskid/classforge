# Stage 1: Build React into static assets
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Remove default site
RUN rm /etc/nginx/conf.d/default.conf
# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/classforge.conf
# Copy build output
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]