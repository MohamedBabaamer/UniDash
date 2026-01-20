# 🤖 AI Features Setup Guide

## ✨ What's New?
Your UniDash now has **AI-powered description generation** for:
- **Chapter descriptions** in Admin Chapters
- **Series descriptions** (TD/TP/Exam) in Admin Series

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Your FREE API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select your Google Cloud project (or create a new one)
4. Copy the API key

### Step 2: Add API Key to Your Project
1. Open the file `.env.local` in your project root
2. Replace `your_api_key_here` with your actual API key:
   ```
   VITE_GEMINI_API_KEY=AIzaSyC_your_actual_key_here
   ```
3. Save the file

### Step 3: Restart Dev Server
```bash
npm run dev
```

## 🎯 How to Use

### In Admin Chapters:
1. Select a course
2. Enter chapter number and title
3. Click the **"✨ AI Generate"** button next to Description
4. Wait 2-3 seconds - description appears automatically!

### In Admin Series:
1. Select course and type (TD/TP/Exam)
2. Enter title
3. Click **"✨ AI Generate"** 
4. AI creates a relevant description based on course context

## 💡 Tips
- Make sure to enter the **title** before clicking AI Generate
- The AI considers:
  - Course name
  - Professor name
  - Chapter/series title
  - Type (TD/TP/Exam for series)
- You can edit the generated description if needed
- If it doesn't work, check:
  1. API key is correct in `.env.local`
  2. Dev server restarted after adding key
  3. Check browser console (F12) for error messages

## 🆓 Pricing
- **Gemini 1.5 Flash is 100% FREE!**
- 15 requests per minute
- 1,500 requests per day
- 1 million requests per month
- Perfect for academic use - you'll never hit the limits!

## 🔒 Security
- Keep your `.env.local` file private
- Never commit it to Git (already in .gitignore)
- API key only works from your domain

---

Need help? Check the console (F12) for detailed error messages!
