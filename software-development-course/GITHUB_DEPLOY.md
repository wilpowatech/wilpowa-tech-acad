# Pushing DevCourse to GitHub

## Current Status
✅ All latest features implemented:
- Star Wars dark theme (cyan, gold, pink accents)
- Navbar with user avatar dropdown
- Forgot password functionality
- Reset password system
- 12-week countdown timer for students
- Course content manager for instructors
- Plagiarism detection system
- Grading and certificate generation
- Complete 12-week curriculum

## Pre-Deployment Checklist

### 1. Verify Environment Variables
Ensure these are set in your GitHub repository secrets:
```
NEXT_PUBLIC_SUPABASE_URL=https://plfgabgsyyjjofhvumlp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 2. Database Setup
Run the seed script to populate course content:
```bash
# Execute in Supabase SQL Editor
cat scripts/seed-course-content.sql
```

### 3. Verify Key Files
- [x] All authentication pages (/app/auth/*)
- [x] Student dashboard with navbar
- [x] Instructor content manager
- [x] Course content seed script
- [x] Star Wars theme (app/globals.css)
- [x] Forgot/Reset password components
- [x] 12-week countdown timer

## Push to GitHub Steps

### Option 1: Git Command Line
```bash
# Navigate to project directory
cd v0-software-development-course

# Add all files
git add .

# Commit with descriptive message
git commit -m "feat: Add Star Wars theme, password recovery, and complete 12-week curriculum

- Implemented Star Wars dark space theme with cyan/gold/pink accents
- Added navbar with user avatar dropdown for authenticated users
- Implemented forgot password and reset password flows
- Created comprehensive 12-week course content structure
- Added course content manager for instructors
- Built enrollment countdown timer for students
- Complete curriculum with 3 lectures/week, labs, quizzes, and 4 exams
- Plagiarism detection with 3-strike system
- Automated grading and certificate generation
- Ready for production deployment"

# Push to main branch
git push origin main
```

### Option 2: GitHub Desktop
1. Open GitHub Desktop
2. Click "Current Repository" → your repo
3. Review all changed files
4. Enter summary: "Add Star Wars theme, password recovery, and full curriculum"
5. Click "Commit to main"
6. Click "Push origin"

### Option 3: v0 GitHub Integration
1. Click the GitHub icon in v0 sidebar
2. Review all pending changes
3. Create pull request or push directly
4. All changes will be committed

## Database Seeding (One-Time Setup)

After first deployment, seed the course content:

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to SQL Editor
4. Click "New Query"
5. Copy entire content from `/scripts/seed-course-content.sql`
6. Paste and execute
7. Wait for completion (creates 12 weeks of content)

## Testing Before Production

### 1. Authentication Testing
- [ ] Create new student account
- [ ] Create new instructor account
- [ ] Test login/logout
- [ ] Test forgot password email
- [ ] Test password reset link

### 2. Student Features
- [ ] View dashboard with 12-week countdown
- [ ] Enroll in a course
- [ ] Access course materials
- [ ] Submit a lab
- [ ] Take a quiz
- [ ] Download certificate

### 3. Instructor Features
- [ ] Access content manager
- [ ] Add lectures with videos
- [ ] Add labs and quizzes
- [ ] Grade submissions
- [ ] View plagiarism reports
- [ ] Issue certificates

### 4. Theme & UI
- [ ] Verify Star Wars dark theme colors
- [ ] Test navbar on all pages
- [ ] Check responsive design (mobile/tablet)
- [ ] Test user avatar dropdown

## Production Deployment

### Deploy to Vercel
```bash
# If using Vercel CLI
vercel --prod

# Or use GitHub integration:
# 1. Connect GitHub repo to Vercel
# 2. Auto-deploys on push to main
# 3. View at https://your-domain.vercel.app
```

### Deploy to Other Platforms

**Using Heroku:**
```bash
git push heroku main
```

**Using AWS Amplify:**
1. Connect GitHub repo
2. Configure build settings
3. Auto-deploy on push

## Post-Deployment

### 1. Verify Production
- Test signup/login at production URL
- Create test student and instructor accounts
- Verify forgot password emails are sent
- Check 12-week timer calculation
- Test course enrollment

### 2. Set Up Email Service
For forgot password emails to work:
1. Configure Supabase Email Service
2. Set reply-to address
3. Customize email templates
4. Test email delivery

### 3. Monitoring
- Set up error tracking (Sentry)
- Monitor database performance
- Track user analytics
- Set up uptime monitoring

## Important Notes

⚠️ **Database:** The seed script uses a hardcoded instructor ID. You may need to:
1. Create an instructor account first
2. Update the UUID in seed script with your instructor ID
3. Or adjust script to use first instructor found

⚠️ **Supabase Keys:** Never commit `.env.local` with real keys to GitHub. Use GitHub Secrets instead.

⚠️ **Storage:** User profile images are stored in memory. For production, set up Vercel Blob or S3 storage.

## Troubleshooting

### Forgot Password Not Working
- Check Supabase email configuration
- Verify SMTP settings
- Check spam folder
- Review error logs in Vercel

### Database Errors
- Verify Supabase connection string
- Check database hasn't reached row limits
- Review RLS policies
- Check network connectivity

### Build Failures
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors
- Verify all imports are correct
- Review build logs

## Need Help?

See these documents for more info:
- `/ENV_SETUP.md` - Environment configuration
- `/SETUP_GUIDE.md` - Initial setup instructions
- `/COURSE_CONTENT_GUIDE.md` - Content management
- `/FULL_COURSE_CONTENT.md` - Complete curriculum

---

**Last Updated:** 2024
**Version:** 1.0 - Production Ready
