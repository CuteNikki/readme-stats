FROM oven/bun:1.4.0-alpine

WORKDIR /app

# Dependencies first, so a change to the code alone reuses them
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY index.ts ./
COPY src ./src
COPY fonts ./fonts

ENV DATA_DIR=/data PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
  CMD ["wget", "-qO-", "http://127.0.0.1:3000/health"]

CMD ["bun", "run", "index.ts"]
