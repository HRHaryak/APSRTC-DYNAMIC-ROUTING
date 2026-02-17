# Backend Setup Instructions

## Prerequisites
- Python 3.9 or higher
- Pip (Python package manager)

## Installation

1. Navigate to the project root directory.
2. Install the required Python packages:

```bash
pip install -r backend/requirements.txt
```

## Running the Backend

**IMPORTANT:** You must run the backend from the `backend` directory to avoid conflicts with local folders.

1. Navigate to the `backend` directory:

```bash
cd backend
```

2. Start the server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

## Swagger Documentation

You can view the interactive API documentation at `http://localhost:8000/docs`.

## Database Migration

Ensure you have run the migration SQL file located at `supabase/migrations/20240210000000_initial_schema.sql` in your Supabase SQL Editor.
