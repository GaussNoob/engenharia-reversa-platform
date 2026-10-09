FROM debian:bookworm-slim AS compiler
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ binutils fasm g++-mingw-w64-x86-64 && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y --no-install-recommends qemu-user && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace

FROM python:3.13-slim-bookworm AS python
WORKDIR /workspace

FROM debian:bookworm-slim AS native
WORKDIR /workspace

FROM node:26-bookworm-slim AS model
COPY infrastructure/runner-images/model-runner.mjs /opt/model-runner.mjs
WORKDIR /workspace
