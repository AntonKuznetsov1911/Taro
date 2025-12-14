# Web Dockerfile for Railway (static export + simple server)
FROM node:20-slim as build
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend ./
RUN npx expo export --platform web --output-dir dist

FROM python:3.11-slim as serve
WORKDIR /app
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["python3", "-m", "http.server", "3000", "--directory", "dist"]
