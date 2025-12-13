# PowerShell скрипт для замены process.env на CONFIG во всех файлах

$files = @(
    "frontend\app\astro-analysis.tsx",
    "frontend\app\history.tsx",
    "frontend\app\deck.tsx",
    "frontend\app\reading.tsx",
    "frontend\app\deck\[id].tsx",
    "frontend\app\compatibility.tsx",
    "frontend\app\card-test.tsx",
    "frontend\app\palmistry.tsx",
    "frontend\app\camera.tsx",
    "frontend\app\horoscope.tsx",
    "frontend\app\profile.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processing $file..."

        $content = Get-Content $fullPath -Raw -Encoding UTF8

        # Add import if not present
        if ($content -notmatch "import \{ CONFIG \}") {
            $content = $content -replace "^(import.*react.*;\r?\n)", "`$1import { CONFIG } from '../src/config';`n"
        }

        # Replace all variations of EXPO_PUBLIC_BACKEND_URL
        $content = $content -replace "const EXPO_PUBLIC_BACKEND_URL = process\.env\.EXPO_PUBLIC_BACKEND_URL;", "const EXPO_PUBLIC_BACKEND_URL = CONFIG.BACKEND_URL;"
        $content = $content -replace "const EXPO_PUBLIC_BACKEND_URL = Constants\.expoConfig\?\.extra\?\.EXPO_PUBLIC_BACKEND_URL \|\| 'http://localhost:8001';", "const EXPO_PUBLIC_BACKEND_URL = CONFIG.BACKEND_URL;"
        $content = $content -replace "const apiUrl = Constants\.expoConfig\?\.extra\?\.backendUrl \|\| process\.env\.EXPO_PUBLIC_BACKEND_URL;", "const apiUrl = CONFIG.API_URL;"

        Set-Content $fullPath $content -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Updated $file"
    } else {
        Write-Host "  ✗ File not found: $file"
    }
}

Write-Host "`nDone!"
