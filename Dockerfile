FROM mcr.microsoft.com/playwright:v1.60.0-noble AS deps

WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm run build

FROM mcr.microsoft.com/playwright:v1.60.0-noble AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY server ./server

ENV PORT=3000 \
    PDF_MAX_CONCURRENT=3 \
    PDF_RENDER_TIMEOUT_MS=120000 \
    PDF_PRINT_READY_TIMEOUT_MS=120000 \
    PDF_ALLOW_EXTERNAL_RESOURCES=false

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["pnpm", "run", "start"]
