# Application Icons Guide

This directory should contain the application icons for the desktop build.

## Required Icon Files

1. **icon.png** - Linux AppImage icon (512x512 or 256x256 PNG)
2. **icon.ico** - Windows executable icon (multi-size ICO file)
3. **icon.icns** - macOS application icon (ICNS format)

## Quick Icon Creation

### Option 1: Online Icon Generator (Easiest)
1. Visit https://www.icoconverter.com/ or https://cloudconvert.com/
2. Upload your base PNG image (preferably 512x512 or 1024x1024)
3. Generate all three formats
4. Download and place in this directory

### Option 2: Use ImageMagick (Command Line)

#### Install ImageMagick
```bash
# Windows (using Chocolatey)
choco install imagemagick

# macOS
brew install imagemagick

# Linux
sudo apt-get install imagemagick
```

#### Create Icons
```bash
# Create PNG (512x512)
convert your-logo.png -resize 512x512 icon.png

# Create ICO (Windows - multiple sizes)
convert your-logo.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico

# Create ICNS (macOS)
# First create iconset directory
mkdir icon.iconset
sips -z 16 16     your-logo.png --out icon.iconset/icon_16x16.png
sips -z 32 32     your-logo.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     your-logo.png --out icon.iconset/icon_32x32.png
sips -z 64 64     your-logo.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   your-logo.png --out icon.iconset/icon_128x128.png
sips -z 256 256   your-logo.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   your-logo.png --out icon.iconset/icon_256x256.png
sips -z 512 512   your-logo.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   your-logo.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 your-logo.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
mv icon.icns frontend/public/
```

## Icon Design Recommendations

- **Simple and recognizable** at small sizes (16x16)
- **High contrast** for visibility on different backgrounds
- **Square aspect ratio** (1:1)
- **Transparent background** (PNG/ICO)
- **Minimum resolution**: 512x512 pixels
- **Recommended resolution**: 1024x1024 pixels

## Icon Ideas for Compliance Tracker

- ✅ Checklist with checkmarks
- 🛡️ Shield with checkmark
- 📋 Clipboard with compliance items
- 📅 Calendar with task indicators
- 📊 Dashboard/chart icon
- 🔒 Lock with document (security/compliance)

## Temporary Workaround

If you need to build without custom icons:

1. **Comment out icon references** in [`package.json`](Compliance-Tracker-Notifier/package.json:30):
   ```json
   "build": {
     "win": {
       // "icon": "frontend/public/icon.ico"
     },
     "mac": {
       // "icon": "frontend/public/icon.icns"
     },
     "linux": {
       // "icon": "frontend/public/icon.png"
     }
   }
   ```

2. **Or use Electron default icons** (not recommended for production)

## File Specifications

### icon.png (Linux)
- Format: PNG
- Size: 512x512 or 256x256
- Transparency: Supported
- Color: RGB or RGBA

### icon.ico (Windows)
- Format: ICO
- Sizes: Multiple (16, 32, 48, 64, 128, 256)
- Transparency: Supported
- Color: RGB or RGBA

### icon.icns (macOS)
- Format: ICNS
- Sizes: Multiple (16-1024)
- Transparency: Supported
- Color: RGB or RGBA

## Testing Icons

After adding icons, rebuild the application:
```bash
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

Check the built application in the `dist-electron` directory.