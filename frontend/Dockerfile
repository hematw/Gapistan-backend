FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_SOCKET_URL=http://localhost:3000
ARG VITE_FILES_URL=http://localhost:3000
ARG VITE_LIVEKIT_SERVER_URL=ws://localhost:7880
ARG VITE_E2EE_ENABLED=true

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_FILES_URL=$VITE_FILES_URL
ENV VITE_LIVEKIT_SERVER_URL=$VITE_LIVEKIT_SERVER_URL
ENV VITE_E2EE_ENABLED=$VITE_E2EE_ENABLED

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
