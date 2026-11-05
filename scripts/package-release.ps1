$ErrorActionPreference='Stop'
$stage=(Resolve-Path '.qa/release-final').Path
$unit=Get-Content '.qa/final-tests.json' -Raw | ConvertFrom-Json
$browser=Get-Content '.qa/browser/results.json' -Raw | ConvertFrom-Json
$integration=Get-Content '.qa/integration.json' -Raw | ConvertFrom-Json
$production=Get-Content '.qa/production-smoke.json' -Raw | ConvertFrom-Json
if($unit.numFailedTests -ne 0 -or $unit.numPassedTests -ne 170 -or $unit.numPendingTests -ne 0){throw 'Unit gate failed'}
if($browser.passed -ne 126 -or $browser.errors.Count -ne 0 -or $browser.failed.Count -ne 0 -or @($browser.interactions | Where-Object status -ne PASS).Count -ne 0 -or $browser.interactions.Count -ne 10){throw 'Browser gate failed'}
if($integration.passed -ne 27 -or $integration.failed -ne 0 -or $production.passed -ne 7){throw 'Integration gate failed'}
$release=New-Item -ItemType Directory -Path release -Force
$zip=Join-Path $release.FullName 'samparkacademy-node-hostinger.zip'
if(Test-Path -LiteralPath $zip){throw 'Refusing to overwrite existing release ZIP'}
$allow=@('server','src','public','database','index.html','package.json','package-lock.json')
$paths=$allow | ForEach-Object {Join-Path $stage $_}
$inventory=@()
foreach($root in $paths){
 foreach($file in @(Get-ChildItem -LiteralPath $root -File -Recurse)){
  $relative=$file.FullName.Substring($stage.Length+1).Replace('\','/')
  if($relative -match '(^|/)(\.env[^/]*|\.git|node_modules|uploads|\.qa|dist)(/|$)|\.(pem|key|db|sqlite|log|bak)$'){throw "Forbidden archive path: $relative"}
  if($file.Extension -in @('.js','.jsx','.json','.html','.css','.sql')){
   $text=Get-Content -LiteralPath $file.FullName -Raw
   if($text -match 'BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY|rzp_live_|sk_live_|checkout\.razorpay\.com|synthetic-local-only|Synthetic-only-passphrase'){throw "Privacy/payment scan rejected: $relative"}
  }
  $inventory+=@{path=$relative;bytes=$file.Length;sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
 }
}
Compress-Archive -LiteralPath $paths -DestinationPath $zip -CompressionLevel Optimal
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead($zip)
try{
 $entries=@($archive.Entries | Where-Object { $_.Name })
 if($entries.Count -ne $inventory.Count){throw 'Archive inventory count mismatch'}
 foreach($entry in $entries){
  $name=$entry.FullName.Replace('\','/')
  $expected=@($inventory | Where-Object path -eq $name)
  if($expected.Count -ne 1 -or $name -match '(^/|(^|/)\.\.(/|$))'){throw "Unexpected archive entry: $name"}
  $stream=$entry.Open();$sha=[Security.Cryptography.SHA256]::Create()
  try{$actual=([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-','').ToLowerInvariant()}finally{$stream.Dispose();$sha.Dispose()}
  if($actual -ne $expected[0].sha256){throw "Archive content mismatch: $name"}
 }
}finally{$archive.Dispose()}
$hash=(Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
$size=(Get-Item -LiteralPath $zip).Length
Set-Content -LiteralPath 'release/samparkacademy-node-hostinger.sha256' -Value "$hash  samparkacademy-node-hostinger.zip" -Encoding ASCII
$manifest=@{project='Sampark Skill Academy';architecture='React + Vite + Express + MariaDB';scope='PARTIAL - isolated synthetic staging only';created_utc=[DateTime]::UtcNow.ToString('o');archive='samparkacademy-node-hostinger.zip';bytes=$size;sha256=$hash;entry='server/server.js';node_verified='24.18.0';database_verified='MariaDB 11.8.9';deployment_method='hPanel managed Node.js source ZIP; build npm run build; output dist';tests=@{unit_passed=170;failed=0;skipped=0;integration_passed=27;production_smoke_passed=7;responsive_passed=126;browser_interactions_passed=10};feature_areas=@{pass=13;blocked=7};production_ready=$false;deployment_performed=$false;upstream_snapshot_sha256='ada2682dedb063a4f13c5ee14036a5da7d153c9bc95bc55ff68eebee9fef766a';files=$inventory}
$manifest | ConvertTo-Json -Depth 8 | Set-Content 'release/DEPLOYMENT_MANIFEST.json' -Encoding UTF8
Copy-Item 'docs/HOSTINGER_STAGING_GUIDE.md' 'release/HOSTINGER_MANUAL_DEPLOYMENT.md'
Copy-Item 'docs/PRODUCTION_CUTOVER_PLAN.md' 'release/ROLLBACK_GUIDE.md'
@"
# Final local release verification

Scope: PARTIAL implementation; safe isolated synthetic staging review package. Complete Flask parity and production readiness remain BLOCKED. No production modification or deployment occurred.

PASS: 170 unit tests, 0 failed, 0 skipped; 27 real MariaDB integration checks; 7 isolated production-mode smoke checks; 126 responsive checks; 10 browser interactions. Final console errors and failed requests: zero. Lint and frontend build passed. Clean runtime installation: 122 packages installed, 123 audited, zero known npm advisories. Build output is generated on Hostinger from source.

PASS: ZIP opened and every non-directory entry was decompressed and SHA256-compared to its source allowlist. $($inventory.Count) files. Privacy/payment scan passed. No environment files, credentials, production records/uploads, private documents, databases, .git, QA artifacts, caches, dist or node_modules included. Test/development dependencies are omitted from the root release manifest. Lockfile retains dependency resolution metadata; this is not installed test tooling.

ZIP bytes: $size
SHA256: $hash

Hostinger workflow: source ZIP for a separate managed Node.js staging app, Express entry server/server.js, build npm run build, output dist, Node 24.x. Do not extract over public_html or modify hbuilds/current. Actual hosted build, Linux native image modules, TLS/proxy, storage persistence and rollback controls remain NOT TESTED on Hostinger.

BLOCKED: existing database migration provenance; membership verification mapping; original receipts/refund/subscription/Flask financial import; complete legacy audit, structured application/private attachments, SEO and mail-outbox parity; legal/bank/QR originals; full organisational content/retention/consent approval. See docs/FEATURE_PARITY_MATRIX.md. The package does not claim these features are implemented or tested.

Evidence remains local under .qa/browser, .qa/screenshots, .qa/performance, .qa/final-tests.json, .qa/integration.json and .qa/production-smoke.json. No Flask test result is reused as Node acceptance evidence.
"@ | Set-Content 'release/FINAL_RELEASE_VERIFICATION.md' -Encoding UTF8
Write-Output (@{zip=$zip;bytes=$size;sha256=$hash;files=$inventory.Count} | ConvertTo-Json)
