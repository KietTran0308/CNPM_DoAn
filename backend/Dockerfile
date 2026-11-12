FROM node:22-alpine

WORKDIR /app

# Prisma trên Alpine cần OpenSSL hệ thống.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/main.js"]
