# Run only on a disposable Windows build runner; verifies the public preview upgrade.
$ErrorActionPreference = 'Stop'
if ($env:RUNNER_OS -ne 'Windows' -or $env:CI -ne 'true') {
  throw 'Installation checks require a disposable Windows CI runner.'
}
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$baseline = Join-Path $env:RUNNER_TEMP 'glass-notes-baseline'
New-Item -ItemType Directory -Force $baseline | Out-Null
gh release download v0.1.8 --repo AlexShen-Oguri/glass-note --pattern '*windows-x64.zip' --dir $baseline
if ($LASTEXITCODE -ne 0) { throw 'Could not download the existing public installer.' }
Expand-Archive (Get-ChildItem $baseline -Filter '*.zip').FullName (Join-Path $baseline 'unpacked')
$oldInstaller = @(Get-ChildItem (Join-Path $baseline 'unpacked') -Recurse -Filter '*setup.exe')
$newInstaller = @(Get-ChildItem '.cache/desktop/target' -Recurse -Filter '*setup.exe')
if ($oldInstaller.Count -ne 1 -or $newInstaller.Count -ne 1) { throw 'Expected one old and one new installer.' }
$installDir = Join-Path $env:LOCALAPPDATA 'Glass Notes'
function Install-Preview($installer) {
  $process = Start-Process $installer -ArgumentList '/S', "/D=$installDir" -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Installer failed: $($process.ExitCode)" }
}
Install-Preview $oldInstaller[0].FullName
$dataDir = Join-Path $env:APPDATA 'com.glassnotes.desktop/data'
New-Item -ItemType Directory -Force $dataDir | Out-Null
$sentinel = Join-Path $dataDir 'glass-notes.lab.v1.json'
$sample = '{"upgradeCheck":"preserve-exact-local-record"}'
[IO.File]::WriteAllText($sentinel, $sample)
Install-Preview $newInstaller[0].FullName
$registration = @(Get-ChildItem 'HKCU:/Software/Microsoft/Windows/CurrentVersion/Uninstall' |
  Get-ItemProperty | Where-Object DisplayName -EQ 'Glass Notes')
if ($registration.Count -ne 1 -or $registration[0].DisplayVersion -ne $version) {
  throw 'Windows registration did not advance to the new version.'
}
$registeredDir = $registration[0].InstallLocation.Trim('"')
if ($registeredDir -ne $installDir) { throw 'Upgrade changed the installation directory.' }
if ([IO.File]::ReadAllText($sentinel) -cne $sample) { throw 'Upgrade changed existing local data.' }
$binary = Join-Path $registeredDir $registration[0].MainBinaryName
if (!(Test-Path $binary) -or !(Test-Path (Join-Path $registeredDir 'uninstall.exe'))) {
  throw 'Installed application or uninstaller is missing.'
}
$app = Start-Process $binary -PassThru
Start-Sleep -Seconds 10
$app.Refresh()
if ($app.HasExited) { throw 'Installed application exited during launch.' }
Stop-Process -Id $app.Id
New-Item -ItemType Directory -Force artifacts | Out-Null
@{ version=$version; baseline='0.1.8'; registration=$true; localDataPreserved=$true; launch=$true } |
  ConvertTo-Json | Set-Content artifacts/windows-install-check.json
