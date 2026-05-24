FROM mcr.microsoft.com/playwright:v1.49.1-noble AS base

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV PORT=3000 \
    PDF_MAX_CONCURRENT=3 \
    PDF_RENDER_TIMEOUT_MS=120000 \
    PDF_PRINT_READY_TIMEOUT_MS=120000 \
    PDF_ALLOW_EXTERNAL_RESOURCES=false

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
