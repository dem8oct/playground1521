# Dev Server Overheating - Troubleshooting Guide

## Problem
The Vite dev server is causing MacBook to overheat and killing testing sessions.

---

## ✅ Already Applied Fix

### Optimized Vite Config
Updated `vite.config.ts` with performance optimizations:
- Ignore `node_modules` and `.git` from file watching (reduces CPU)
- Disable source maps in dev (reduces memory)
- Configure HMR overlay

**Changes made in:** `vite.config.ts`

---

## Quick Fixes (Try These First)

### 1. Restart Dev Server
After the Vite config changes, restart the server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 2. Close Browser DevTools
DevTools with heavy logging can spike CPU:
- Close the Console tab when not needed
- Close React DevTools extension if installed
- Keep only the Network tab open if debugging
- **Tip:** Use incognito mode for testing to avoid extension overhead

### 3. Clear Browser Data
In the browser:
- Clear cache and cookies
- Clear localStorage (Application tab → Local Storage → Clear)
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### 4. Monitor System Resources
**Mac Activity Monitor:**
- Open Activity Monitor
- Search for "node"
- Check CPU% - should be <50% when idle
- If >100%, there's an infinite loop or polling issue

---

## Diagnostic Steps

### Check Console Logs
When the page loads, open browser Console and check:
1. Are there repeating log messages?
2. Are there errors that keep firing?
3. How many logs appear in the first 5 seconds?
4. **Expected:** Just a few logs on page load
5. **Problem:** Hundreds of logs repeating constantly

### When Does It Overheat?
Note when the CPU spikes:
- On page load?
- When navigating between pages?
- When idle on a specific page?
- After a specific action (create group, invite user, etc.)?

This helps identify if it's:
- A component re-render issue
- A polling/interval issue
- A memory leak

---

## Advanced Fixes (If Still Overheating)

### 1. Check for Infinite Re-renders
Look for components that might be re-rendering infinitely:

**Common causes:**
- State updates inside useEffect without proper dependencies
- Objects/arrays recreated on every render
- Context providers updating too frequently

**How to check:**
1. Open React DevTools
2. Go to Profiler tab
3. Start recording
4. Stop after 5 seconds
5. Look for components rendering hundreds of times

### 2. Check for Polling/Intervals
Search for any intervals or polling in the codebase:
```bash
grep -r "setInterval" src/
grep -r "polling" src/
```

If found, make sure they:
- Have proper cleanup (clearInterval)
- Don't run when component is unmounted
- Have reasonable intervals (not <100ms)

### 3. Reduce Bundle Size
Check bundle size:
```bash
npm run build
```

Look for large dependencies that might be slowing down HMR.

### 4. Disable React DevTools
React DevTools can cause CPU spikes:
1. Disable the extension temporarily
2. Test if CPU usage improves

---

## Nuclear Options (Last Resort)

### 1. Delete node_modules and Reinstall
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

### 2. Clear Vite Cache
```bash
rm -rf node_modules/.vite
npm run dev
```

### 3. Use Production Build for Testing
If dev server is unusable:
```bash
npm run build
npm run preview
```
This runs a production build locally (no HMR, but stable).

---

## Workarounds During Testing

### Option 1: Restart Periodically
- Test for 10-15 minutes
- Restart dev server
- Continue testing

### Option 2: Use Production Preview
```bash
npm run build && npm run preview
```
- Slower to rebuild
- But more stable for long testing sessions

### Option 3: Test on Another Machine
- Push to GitHub
- Clone on another machine
- Test there

---

## Report Back

After trying the fixes, note:

1. **Did the Vite config optimization help?** (vite.config.ts changes)
2. **What's the CPU usage now?** (Activity Monitor)
3. **Are there repeating console logs?** (Browser console)
4. **When does it spike?** (Page load, navigation, idle?)

This will help narrow down the root cause!

---

## Contact

If still having issues, provide:
- CPU% from Activity Monitor when it spikes
- Screenshot of browser console logs
- Which page/action triggers the spike

Good luck! 🔥➡️❄️
