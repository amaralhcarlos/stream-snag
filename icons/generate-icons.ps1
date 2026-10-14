Add-Type -AssemblyName System.Drawing

function New-Icon {
    param(
        [int]$Size,
        [string]$Path
    )

    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $bgColor = [System.Drawing.Color]::FromArgb(255, 139, 0, 0)
    $graphics.Clear($bgColor)

    $fontSize = [Math]::Floor($Size * 0.65)
    if ($fontSize -lt 1) { $fontSize = 1 }
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $graphics.DrawString("M", $font, $brush, $rect, $format)

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $bitmap.Dispose()
    $font.Dispose()
    $brush.Dispose()
}

$iconsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

New-Icon -Size 16 -Path (Join-Path $iconsDir "icon16.png")
New-Icon -Size 48 -Path (Join-Path $iconsDir "icon48.png")
New-Icon -Size 128 -Path (Join-Path $iconsDir "icon128.png")

Write-Output "Icons generated."
