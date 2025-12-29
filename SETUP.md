# Barber Booking App - Setup Guide

This guide will help you set up the backend services for the barber booking application.

## Prerequisites
- Node.js 20+ installed
- Google Account (for Calendar API)
- Firebase Account
- Supabase Account

## Step 1: Firebase Setup (SMS Authentication)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Project name: "Barber Booking" (or your choice)
4. Enable Google Analytics (optional)
5. Create project

### Enable Phone Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Phone** → **Enable**
3. Save

### Get Firebase Config
1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to "Your apps" → Click **Web** icon (`</>`)
3. Register app name: "Barber Booking Web"
4. Copy the `firebaseConfig` object values

### Add to `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### (Optional) Add Test Phone Numbers for Development
1. Authentication → Settings → Phone numbers for testing
2. Add: `+212600000000` with code `123456`

## Step 2: Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Barber Booking"
3. Enable **Google Calendar API**:
   - APIs & Services → Library
   - Search "Google Calendar API"
   - Click **Enable**

### Create Service Account
1. IAM & Admin → Service Accounts → **Create Service Account**
2. Name: `barber-booking-service`
3. Grant role: **Editor** (or create custom role with Calendar permissions)
4. Click **Done**
5. Click on the created service account
6. Go to **Keys** tab → **Add Key** → **Create new key**
7. Choose **JSON** → **Create**
8. Download the JSON file (keep it safe!)

### Share Your Google Calendar
1. Open [Google Calendar](https://calendar.google.com/)
2. Find your calendar in the left sidebar
3. Click **⋮** (three dots) → **Settings and sharing**
4. Scroll to "Share with specific people"
5. Click **Add people**
6. Paste the service account email from the JSON file (e.g., `barber-booking-service@your-project.iam.gserviceaccount.com`)
7. Permission: **Make changes to events**
8. Click **Send**

### Get Calendar ID
1. In Calendar Settings, scroll to "Integrate calendar"
2. Copy the **Calendar ID** (e.g., `primary` or `abc123@group.calendar.google.com`)

### Add to `.env.local`:
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=barber-booking-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_FROM_JSON_FILE\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

**Note**: Copy the `private_key` value from the JSON file, including the `\n` characters.

## Step 3: Supabase Setup

1. Go to [Supabase](https://supabase.com/)
2. Click **New project**
3. Organization: Create or select
4. Project name: "barber-booking"
5. Database password: (generate strong password)
6. Region: Choose closest to your users
7. Click **Create new project** (wait ~2 minutes)

### Create Tables
1. Go to **SQL Editor**
2. Click **New query**
3. Paste and run:

```sql
-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  duration INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id UUID REFERENCES services(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample services (optional)
INSERT INTO services (id, title, duration, price, image, category) VALUES
('1', 'Haircut', 30, 30.00, '/haircut.jpg', 'barbering'),
('2', 'Beard Trim', 25, 20.00, '/beard-trim.jpg', 'barbering'),
('3', 'Hair Wash', 15, 10.00, '/hair-wash.jpg', 'barbering'),
('4', 'Hairdressing', 15, 20.00, '/hairdressing.jpg', 'barbering'),
('5', 'Curly', 10, 20.00, '/hairdressing.jpg', 'barbering'),
('6', 'Kids Haircut', 30, 30.00, '/haircut.jpg', 'barbering');
```

### Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon/public** key
   - **service_role** key (keep secret!)

### Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Final Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all the values from steps 1-3

3. Restart your dev server:
   ```bash
   npm run dev
   ```

## Testing

1. **Service Selection**: Select a service → Click Continue
2. **Date/Time**: Pick a date → Select an available time slot
3. **Authentication**: 
   - Enter name and phone number (with country code)
   - Click "Send verification code"
   - Enter the 6-digit code from SMS
   - Click "Verify & Book"
4. **Verification**: Check your Google Calendar for the new event!

## Troubleshooting

- **Firebase SMS not sending**: Make sure Phone authentication is enabled and you've added your domain to authorized domains
- **Google Calendar API error**: Verify the service account has access to your calendar
- **Supabase connection error**: Check that your project URL and keys are correct

## Security Notes

- Never commit `.env.local` to git
- Keep your service role keys private
- Use Firebase test phone numbers during development to avoid SMS costs
