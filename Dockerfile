FROM oven/bun:1-alpine

WORKDIR /app
RUN apk add --no-cache g++ make fontconfig

ENV NODE_ENV=production
COPY package.json bun.lock* ./
RUN bun install --production
COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
