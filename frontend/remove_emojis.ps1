# Remove emojis from all JSX/JS files in frontend/src
# Replaces common emoji patterns with clean text or icon-compatible alternatives

$files = Get-ChildItem -Path "src\pages", "src\components" -Recurse -Include "*.jsx","*.js"

$replacements = [ordered]@{
    # Food instructions
    '🍽️ After Food'       = 'After Food'
    '⏰ Before Food'      = 'Before Food'
    '🥛 With Food'        = 'With Food'
    '💧 Empty Stomach'    = 'Empty Stomach'
    # Tabs
    '💊 Basic Info'       = 'Basic Info'
    '🗓️ Schedule & Timing'= 'Schedule & Timing'
    '📋 Clinical Notes'   = 'Clinical Notes'
    # Quick notes chips
    '💧 Take with full glass of water' = 'Take with full glass of water'
    '🌙 Best taken at bedtime'         = 'Best taken at bedtime'
    '☀️ Morning dose'                  = 'Morning dose'
    '🚫 Avoid alcohol'                 = 'Avoid alcohol'
    '🍋 Avoid grapefruit'              = 'Avoid grapefruit'
    '💊 Do not crush/chew'             = 'Do not crush/chew'
    '🏃 Take before exercise'          = 'Take before exercise'
    '🧪 Monitor blood levels'          = 'Monitor blood levels'
    # Refill date
    '📅 Refill due:'                   = 'Refill due:'
    # Reminders
    '✅ Enabled'                        = 'Enabled'
    '❌ Disabled'                       = 'Disabled'
    # Save / Nav buttons
    '💾 Save Changes'                  = 'Save Changes'
    '💾 Save'                           = 'Save'
    '← Back'                            = 'Back'
    'Next →'                            = 'Next'
    # Directive categories
    '💊 Regimen Advice'                = 'Regimen Advice'
    '🥗 Dietary Instruction'           = 'Dietary Instruction'
    '🏃 Lifestyle Order'               = 'Lifestyle Order'
    '📊 Monitoring Instruction'        = 'Monitoring Instruction'
    '📅 Follow-Up Notice'              = 'Follow-Up Notice'
    # Priority
    '🔴 Urgent'                        = 'Urgent'
    '🟠 High'                          = 'High'
    '🟢 Normal'                        = 'Normal'
    # Status/result icons replaced with neutral text
    '✅'                                = ''
    '❌'                                = ''
    '⚠️'                               = ''
    '✓'                                 = ''
    '✗'                                 = ''
    # Tab labels in DoctorDashboard
    '📋 Regimen Timeline'              = 'Regimen Timeline'
    '🏃 Organ Toxicity'                = 'Organ Toxicity'
    # Arrow icons (kept as text)
    '→'                                = ''
    '←'                                = ''
    # Generic bullet points
    '•'                                = '-'
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content
    foreach ($from in $replacements.Keys) {
        $to = $replacements[$from]
        $content = $content.Replace($from, $to)
    }
    # Remove all remaining Unicode emoji ranges (U+1F300–U+1FFFF, U+2600–U+27BF)
    # Using regex to catch anything we missed
    $content = [regex]::Replace($content, '[\u{1F300}-\u{1FFFF}]', '', 'None', [System.Text.RegularExpressions.RegexOptions]::None)
    $content = [regex]::Replace($content, '[\u{2600}-\u{26FF}]', '', 'None', [System.Text.RegularExpressions.RegexOptions]::None)
    $content = [regex]::Replace($content, '[\u{2700}-\u{27BF}]', '', 'None', [System.Text.RegularExpressions.RegexOptions]::None)
    if ($content -ne $original) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Cleaned: $($file.Name)"
    }
}
Write-Host "Done."
