# 4 DPF Alarm - Native Android Setup Script for Windows
# Run this in PowerShell from the project root folder

Write-Host "=== 4 DPF Alarm Native Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if android folder exists
if (Test-Path "android") {
    Write-Host "Android folder already exists. Removing..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "android"
}

# Step 1: Run expo prebuild
Write-Host "Step 1: Running expo prebuild..." -ForegroundColor Green
npx expo prebuild --platform android

if (-not (Test-Path "android")) {
    Write-Host "ERROR: expo prebuild failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Copy Java files
Write-Host "Step 2: Copying native Java files..." -ForegroundColor Green
$sourceDir = "android-native\java\com\vagdiagnostics\app"
$targetDir = "android\app\src\main\java\com\vagdiagnostics\app"

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Copy-Item "$sourceDir\*.java" $targetDir -Force
Write-Host "  Copied: BluetoothConnectionReceiver.java" -ForegroundColor Gray
Write-Host "  Copied: DPFMonitorService.java" -ForegroundColor Gray
Write-Host "  Copied: BootReceiver.java" -ForegroundColor Gray
Write-Host "  Copied: DPFAlarmModule.java" -ForegroundColor Gray
Write-Host "  Copied: DPFAlarmPackage.java" -ForegroundColor Gray

# Step 3: Show manual steps
Write-Host ""
Write-Host "=== MANUAL STEPS REQUIRED ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open: android\app\src\main\AndroidManifest.xml" -ForegroundColor White
Write-Host "   Add content from: android-native\AndroidManifest-additions.xml" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open: android\app\src\main\java\com\vagdiagnostics\app\MainApplication.kt" -ForegroundColor White
Write-Host "   Find 'override fun getPackages()' and add:" -ForegroundColor Gray
Write-Host "   packages.add(DPFAlarmPackage())" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Build APK:" -ForegroundColor White
Write-Host "   npx eas build --platform android --profile preview" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== Setup complete! ===" -ForegroundColor Green
