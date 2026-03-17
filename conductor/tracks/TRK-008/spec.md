# Specification: Core Hardening & Mannheim Deep-Dive (TRK-008)

## 🎯 Goal
Establish a robust, fully tested baseline for the core app functions (Routing, Audio, POI Discovery) specifically for the Mannheim region.

## 📋 Requirements
- **Database Integrity**: Ensure Mannheim POIs are correctly categorized and located.
- **Backend Test Suite**: 
    - Database tests (CRUD, filtering).
    - AI Content Generation tests (Groq integration).
    - Audio Pipeline tests (edge-tts integration).
    - Image Discovery & Proxy tests.
- **Routing Reliability**: Verify optimized path generation for Mannheim-specific coordinates.
- **Frontend Sync**: Ensure the frontend correctly displays and handles data from the updated 0-cost backend.

## 🏗️ Architecture
- **Testing Framework**: `pytest`.
- **Environment**: Use the existing `backend/venv`.
- **AI Models**: Groq (Llama-3.3-70b-versatile).
- **Audio**: edge-tts (Stefan/Katja).
