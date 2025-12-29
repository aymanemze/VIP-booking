# Admin Dashboard Setup Instructions

## Step 1: Run Database Migration

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `supabase-migration.sql` and paste it
5. Click **Run** to execute the migration

This will create all the necessary tables for the admin dashboard.

## Step 2: Set Admin Password

The migration creates a placeholder password hash. You need to set your actual admin password:

### Option A: Using Node.js (Recommended)

1. Open terminal in your project directory
2. Run this command (replace `YOUR_PASSWORD` with your desired password):

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 10).then(hash => console.log(hash));"
```

3. Copy the generated hash
4. Go to Supabase → **Table Editor** → **settings** table
5. Find the row where `key` = `admin_password_hash`
6. Click to edit the `value` column
7. Replace the `hash` value with your generated hash:
   ```json
   {"hash": "YOUR_GENERATED_HASH_HERE"}
   ```

### Option B: Using Supabase SQL Editor

```sql
-- Replace 'your_secure_password' with your actual password
UPDATE settings 
SET value = jsonb_set(
  value, 
  '{hash}', 
  to_jsonb('$2a$10$...')  -- Paste your bcrypt hash here
)
WHERE key = 'admin_password_hash';
```

## Step 3: Add Environment Variable

Add to your `.env.local`:

```bash
ADMIN_PASSWORD=your_secure_password  # Optional, for reference only
```

## Step 4: Test Admin Login

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/login`
3. Enter your password
4. You should be redirected to `/admin/dashboard`

## Admin Routes

- `/admin/login` - Login page
- `/admin/dashboard` - Overview with stats
- `/admin/calendar` - Calendar view (coming next)
- `/admin/customers` - Customer management (coming next)
- `/admin/working-hours` - Working hours setup (coming next)
- `/admin/settings` - App settings (coming next)

## Security Notes

- The admin password is hashed using bcrypt (10 rounds)
- Admin session is stored in HTTP-only cookie (7 days)
- All admin routes should check authentication
- Never commit `.env.local` to git

## Next Steps

Once logged in, you can:
1. View dashboard statistics
2. Access the calendar view
3. Manage customers
4. Configure working hours
5. Update settings

The admin panel is now ready to use!
