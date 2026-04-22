# Multi-stage Dockerfile for Playwright automation testing
# Stage 1: Build stage
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS builder

WORKDIR /workspace

# Copy package files
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY playwright.config.ts playwright.config.ts

# Install dependencies
RUN npm install

# Copy application files
COPY pages/ pages/
COPY tests/ tests/
COPY utils/ utils/

# Build TypeScript (compile .ts files)
RUN npx tsc --noEmit

# Stage 2: Runtime stage
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /workspace

# Install additional dependencies for PDF parsing
RUN apt-get update && apt-get install -y \
    libpoppler-cpp-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy from builder
COPY --from=builder /workspace/node_modules node_modules
COPY --from=builder /workspace/pages pages
COPY --from=builder /workspace/tests tests
COPY --from=builder /workspace/utils utils
COPY --from=builder /workspace/package.json package.json
COPY --from=builder /workspace/tsconfig.json tsconfig.json
COPY --from=builder /workspace/playwright.config.ts playwright.config.ts

# Create directories for test results, artifacts and downloads
RUN mkdir -p /workspace/downloads

# Default command to run tests
CMD ["npm", "test"]
