FROM node:20-bookworm-slim

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci \
  --workspace @thefox/mobile \
  --workspace @thefox/shared \
  --include-workspace-root

COPY apps/mobile apps/mobile
COPY packages/shared packages/shared

ENV CI=1
ENV EXPO_NO_TELEMETRY=1

EXPOSE 8081 19000 19001 19002

CMD ["npm", "run", "start:lan", "--workspace", "@thefox/mobile", "--", "--clear"]
