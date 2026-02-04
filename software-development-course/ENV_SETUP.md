# Environment Variables Setup Guide

## Required Environment Variables

To get the signup and login working, you need to add your Supabase credentials to your project environment variables.

### Step 1: Access Environment Variables in v0

1. Click on the **"Vars"** button in the left sidebar of v0
2. Click **"Add Variable"**
3. Add each variable below

### Step 2: Add These Variables

**Variable 1:**
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://plfgabgsyyjjofhvumlp.supabase.co`

**Variable 2:**
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** (Your Anon Key - Should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Verify in Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy the values from there:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Test the Signup

After adding the variables:
1. Refresh the v0 preview
2. Go to the signup page (`/auth/signup`)
3. Try creating a new account
4. Check the browser console (F12) for any error messages

### Troubleshooting

If signup still doesn't work:

1. **Check Console:** Open browser DevTools (F12) → Console tab
2. **Look for [v0] messages** that indicate what's failing
3. **Common issues:**
   - Missing environment variables (won't initialize)
   - Invalid credentials (wrong key or URL)
   - Database tables not created (we already fixed this)
   - Email already exists (try a different email)

### What Happens During Signup

1. ✅ Supabase Auth creates a user account
2. ✅ User profile is created in the `users` table
3. ✅ User receives confirmation email
4. ✅ Redirects to login page

Once you've added the environment variables, the signup should work perfectly!
