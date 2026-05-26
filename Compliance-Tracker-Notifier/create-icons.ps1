# PowerShell script to create placeholder icons for Compliance Tracker

Add-Type -AssemblyName System.Drawing

# Create 512x512 PNG icon
$bmp = New-Object System.Drawing.Bitmap(512, 512)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(41, 128, 185))

# Draw "CT" text
$font = New-Object System.Drawing.Font('Arial', 120, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF(0, 0, 512, 512)
$g.DrawString('CT', $font, $brush, $rect, $stringFormat)

# Save PNG
$bmp.Save("$PSScriptRoot\resources\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Created icon.png (512x512)"

# Create smaller tray icon (32x32)
$bmpSmall = New-Object System.Drawing.Bitmap(32, 32)
$gSmall = [System.Drawing.Graphics]::FromImage($bmpSmall)
$gSmall.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gSmall.Clear([System.Drawing.Color]::FromArgb(41, 128, 185))

$fontSmall = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Bold)
$rectSmall = New-Object System.Drawing.RectangleF(0, 0, 32, 32)
$gSmall.DrawString('CT', $fontSmall, $brush, $rectSmall, $stringFormat)

$bmpSmall.Save("$PSScriptRoot\resources\tray-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Created tray-icon.png (32x32)"

# Cleanup
$g.Dispose()
$bmp.Dispose()
$gSmall.Dispose()
$bmpSmall.Dispose()
$font.Dispose()
$fontSmall.Dispose()
$brush.Dispose()

Write-Host "Icons created successfully!"
Write-Host "Note: icon.ico will be generated automatically by electron-builder from icon.png"

# Made with Bob
