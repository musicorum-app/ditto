FROM oven/bun:1-alpine

WORKDIR /app
RUN apk add --no-cache g++ make

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
