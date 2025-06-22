# How to Deploy Your Project Online

## Option 1: GitHub Pages (Easiest - 5 minutes)

1. **Create a GitHub account** (if you don't have one): https://github.com

2. **Create a new repository**:
   - Click the green "New" button
   - Name it something like "true-beauty-project"
   - Make it PUBLIC
   - Don't initialize with README

3. **Upload your files**:
   - Click "uploading an existing file"
   - Drag and drop ALL these files:
     - index.html
     - script.js
     - style.css
     - photo-data.js
     - ARTIST_STATEMENT.md
     - PROJECT_EVALUATION.md
   - Create folder "assets" and upload all images and .glb files

4. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Click Save

5. **Your project will be live at**:
   `https://[your-username].github.io/[repository-name]`

## Option 2: Netlify Drop (Even Easier - 2 minutes)

1. **Prepare your files**:
   - Put all files in a single folder
   - Make sure index.html is in the root

2. **Go to**: https://app.netlify.com/drop

3. **Drag and drop** your entire project folder onto the page

4. **Done!** You'll get an instant URL like:
   `https://amazing-wilson-af41d0.netlify.app`

## Option 3: Surge.sh (Command Line - Fastest)

If you're comfortable with command line:

```bash
# Install surge
npm install -g surge

# In your project folder
surge

# Follow prompts, get instant URL
```

## Option 4: CodePen/CodeSandbox (For Simple Projects)

Not ideal for your project due to multiple files and assets, but possible.

## What to Submit to Your Tutor:

1. **The live URL** (from any option above)
2. **Your ARTIST_STATEMENT.md** (as PDF or Word doc)
3. **Screenshots** of the project running
4. **Optional**: GitHub repository link for code review

## Quick Fix for Local Testing

If you just need to test locally without Python:
- Use VS Code with "Live Server" extension
- Or use Node.js: `npx serve`
- Or use any static file server