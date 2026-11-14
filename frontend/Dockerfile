
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS=false
ENV NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS=$NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Match the standalone output consumed by the runtime stage, also on Render Docker.
ENV BREWLITE_RENDER_DOCKER=true
RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
