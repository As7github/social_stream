# Winner Picker storage setup

The scalable storage layer uses Supabase PostgreSQL. The browser never receives the Supabase secret key.

## 1. Database
Open Supabase SQL Editor and run:

supabase/schema.sql

## 2. Server environment variables
In the hosting project add:

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY

Never put SUPABASE_SECRET_KEY into winner-picker.html or any browser code.

## 3. Capacity model
Comments/chat messages are converted into unique participants. Participants are stored as rows, not duplicated ticket rows. The storage API reads participants in 1000-row pages and writes them in 500-row batches.

This supports large giveaways without keeping every raw comment in browser storage.

## 4. Local fallback
If server storage is unavailable, the page continues using local browser storage so the picker remains usable during development.
