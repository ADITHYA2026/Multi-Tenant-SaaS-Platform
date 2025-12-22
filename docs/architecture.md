# System Architecture

## Overview
The system consists of a React frontend, Node.js backend, and PostgreSQL database.

## Components
- Browser (Client)
- Frontend (React)
- Backend API (Express)
- Database (PostgreSQL)

## Authentication Flow
User logs in → JWT issued → JWT sent with each request → Backend validates token.

## API Modules
- Auth
- Tenants
- Users
- Projects
- Tasks