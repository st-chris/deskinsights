# DeskInsights

AI-powered document management and collaboration platform built with modern web technologies.

![Status](https://img.shields.io/badge/status-in%20development-yellow)

## Overview

DeskInsights is a full-stack document collaboration platform that combines rich text editing with AI-powered insights. Create, organize, and enhance your documents with features like automatic summarization, AI chat, and content generation.

**Demo Account:** `demo@example.com` / `Demo123!`

## Features

- **Rich Text Editing** - Tiptap editor with formatting, lists, and tables
- **AI Integration** - Summarize, rewrite, expand text using Gemini 3 Flash
- **Document Chat** - Ask questions about your documents with AI
- **AI-Generated Insights** - Automatic document summaries and key points
- **Document Management** - Create, edit, and organize documents
- **Authentication** - Secure JWT-based auth with role management
- **Rate Limiting** - API protection and abuse prevention

## Tech Stack

**Frontend**

- React 18 with TypeScript
- TailwindCSS for styling
- TanStack Query for state management
- Tiptap for rich text editing

**Backend**

- Node.js + Express + TypeScript
- MongoDB with Mongoose
- JWT authentication
- Rate limiting with express-rate-limit

**AI**

- Google Gemini 3 Flash API (free tier)

**Testing**

- Jest + Supertest (backend)
- Vitest (frontend)

## Prerequisites

- Node.js 18+
- MongoDB
- Google Gemini API key (free at ai.google.dev)

## Installation

```bash
# Clone the repository
git clone https://github.com/st-chris/deskinsights.git
cd deskinsights

# Install backend dependencies
cd server
npm install
cp .env.example .env
# Edit .env with your credentials

# Install frontend dependencies
cd ../client
npm install
cp .env.example .env

# Seed demo data (optional)
cd ../server
npm run seed

# Run backend (from server folder)
npm run dev

# Run frontend (from client folder)
npm run dev
```
