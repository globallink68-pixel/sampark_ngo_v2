param([Parameter(Mandatory=$true)][string]$OutputDirectory)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$output = (New-Item -ItemType Directory -Force -Path $OutputDirectory).FullName
$stage = (New-Item -ItemType Directory -Path (Join-Path $root ('.qa/redesign-release-' + [Guid]::NewGuid()))).FullName
$files = @('server','src','public','database','dist','index.html','package.json','package-lock.json')
$docs = @('HOSTINGER_DEPLOYMENT.md','ROLLBACK_PLAN.md','FINAL_ACCEPTANCE_REPORT.md')
$zip = Join-Path $output 'sampark-academy-hostinger-candidate.zip'
if (Test-Path -LiteralPath $zip) { throw 'Candidate archive already exists.' }
foreach ($entry in $files) {
 Copy-Item -LiteralPath (Join-Path $root $entry) -Destination $stage -Recurse
}
foreach ($entry in $docs) {
 Copy-Item -LiteralPath (Join-Path $root ('docs/redesign/' + $entry)) -Destination $stage
}
$inventory = @()
foreach ($file in Get-ChildItem -LiteralPath $stage -File -Force -Recurse) {
 $relative = $file.FullName.Substring($stage.Length + 1).Replace('\','/')
 if ($relative -match '(^|/)(\.env[^/]*|\.git|node_modules|uploads|\.qa)(/|$)|\.(pem|key|db|sqlite|log|bak)$') {
  throw "Forbidden release path: $relative"
 }
 if ($file.Extension -in @('.js','.jsx','.json','.html','.css','.sql','.md')) {
  $content = Get-Content -LiteralPath $file.FullName -Raw
  if ($content -match 'BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY|rzp_live_|sk_live_|synthetic-local-only|Synthetic-only-passphrase') {
   throw "Release content scan rejected: $relative"
  }
 }
 $inventory += [ordered]@{path=$relative; bytes=$file.Length; sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
}
$manifest = [ordered]@{
 application='Sampark Skill Academy'
 entrypoint='server/server.js'
 sourceCommit=(git -C $root rev-parse HEAD)
 migrations=@(Get-ChildItem -LiteralPath (Join-Path $stage 'database/migrations') -Filter '*.sql' | Sort-Object Name | Select-Object -ExpandProperty Name)
 files=@($inventory | Sort-Object { $_.path })
}
$manifestJson = ConvertTo-Json -InputObject $manifest -Depth 5
$manifestJson | Set-Content -Encoding utf8 -LiteralPath (Join-Path $stage 'release-manifest.json')
$manifestJson | Set-Content -Encoding utf8 -LiteralPath (Join-Path $output 'release-manifest.json')
$archiveEntries = @(Get-ChildItem -LiteralPath $stage | Select-Object -ExpandProperty FullName)
Compress-Archive -LiteralPath $archiveEntries -DestinationPath $zip -CompressionLevel Optimal
$sha = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
"$sha  $([IO.Path]::GetFileName($zip))" | Set-Content -Encoding ascii -LiteralPath ($zip + '.sha256')
Write-Output $zip
Write-Output $sha
