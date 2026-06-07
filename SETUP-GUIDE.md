# 💍 Wedding Seating Lookup — Setup Guide
### For Victoria & Raymond's Wedding

---

## What This Is

A beautiful mobile website guests scan via QR code at the entrance to find their table number. No app download needed — it works right in their phone browser.

---

## 📁 Files in This Package

```
wedding-seating/
├── index.html          ← The website (main file)
├── css/style.css       ← Visual styling
├── js/app.js           ← Search logic
├── js/guests.js        ← Guest list (pre-loaded with all 223 guests)
├── sw.js               ← Offline support
├── manifest.json       ← Phone "install" support
└── guests-sample.csv   ← Guest list as a spreadsheet
```

---

## 🚀 Option 1: Deploy to Netlify (Easiest — Free)

**Time required: ~5 minutes**

1. Go to **https://netlify.com** and create a free account
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag the entire `wedding-seating` folder onto the upload area
4. Netlify gives you a URL like: `https://amazing-name-123.netlify.app`
5. (Optional) Click **"Domain settings"** to rename it, e.g. `victoria-raymond.netlify.app`

**Your website is live!** ✅

---

## 🚀 Option 2: Deploy to Vercel (Also Free)

1. Go to **https://vercel.com** and sign up
2. Install Vercel CLI: open Terminal and run:
   ```
   npm install -g vercel
   ```
3. Navigate to the folder:
   ```
   cd wedding-seating
   vercel
   ```
4. Follow the prompts — it gives you a live URL instantly

---

## 🚀 Option 3: GitHub Pages (Free, Permanent)

1. Create a free account at **https://github.com**
2. Click **"New repository"** → name it `wedding-seating`
3. Upload all files in the `wedding-seating` folder
4. Go to **Settings → Pages → Source: main branch / root**
5. Your site will be at: `https://yourusername.github.io/wedding-seating`

---

## 📱 Creating the QR Code

Once your site is live with a URL:

1. Go to **https://qr.io** or **https://www.qrcode-monkey.com**
2. Paste your website URL
3. Choose a style (we recommend gold color to match your theme!)
4. Download as **PNG** at high resolution (at least 1000×1000px)
5. Print on:
   - A sign at the venue entrance
   - Place cards on each table
   - The wedding program

**Pro tip:** Test the QR code with multiple phones before the wedding day!

---

## ✏️ Updating the Guest List

### Method A — Upload CSV on the Website
1. Open your wedding website on any phone or computer
2. Tap **"⚙ Update Guest List"** at the bottom
3. Upload the `guests-sample.csv` file (which you can edit in Excel or Google Sheets)
4. The new list saves to that device's browser

### Method B — Edit guests.js Directly
1. Open `js/guests.js` in any text editor (Notepad, TextEdit)
2. Add or edit guest entries following this format:
   ```
   {"firstName":"Jane","lastName":"Doe","table":"7"},
   ```
3. Re-upload the updated file to Netlify/Vercel

### CSV Format
Your CSV must have these columns (add optional ones as needed):
```
First Name, Last Name, Table, Meal, Seat
John,Smith,12,Chicken,3
Sarah,Wong,5,Vegetarian,
```

---

## 🎨 Customizing Colors

To change the gold color to your wedding colors, open `css/style.css` and edit lines 4–6:
```css
--gold:        #b8963e;   ← Main gold color
--gold-light:  #d4af6a;   ← Lighter accent
--gold-pale:   #f0e4c4;   ← Very light background tints
```

Replace with any hex color code. Use **https://coolors.co** to find matching colors.

---

## 📶 Offline Support

The website automatically caches itself after the first load. If the venue has poor WiFi:
- Guests who have already loaded the page will still be able to search
- The guest list is embedded directly in the site, so no internet is needed after first load

---

## 🧪 Testing Before the Wedding

1. Open the website on your phone
2. Try searching for a few guests by first name only, last name only, and partial names
3. Test on an older Android phone if possible (for elderly guests)
4. Have a coordinator test it at the venue on the wedding day to confirm WiFi

---

## 📞 Day-Of Checklist

- [ ] QR code printed and posted at entrance (min 8" × 8")
- [ ] Website tested on multiple phones
- [ ] Coordinator knows the "not found" protocol
- [ ] Backup printed seating chart available

---

## ❓ Common Questions

**"A guest can't find themselves"**
→ Check for spelling variations. The search handles partial names, so "Jas" will find "Jason".

**"Multiple guests have the same name"**
→ The site shows all matches and asks the guest to confirm their full name.

**"Can guests see other guests' tables?"**
→ Only if they search for them by name — the list isn't shown openly.

**"What if the internet is out at the venue?"**
→ After one load, the site works offline. Have a printed backup just in case.

---

*Made with love for Victoria & Raymond's wedding 💛*
