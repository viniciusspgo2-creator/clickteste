@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
set "CG_FIX_PATH=%~f0"
set "CG_FIX_DIR=%~dp0"
echo.
echo ===========================================================
echo   CLICKTOOLS - CORRECAO AUTOMATICA DOS 3 CONFLITOS DO BOCAO
echo ===========================================================
echo.
powershell.exe -NoProfile -Command "try { $raw=[IO.File]::ReadAllText($env:CG_FIX_PATH,[Text.Encoding]::UTF8); $marker=':CLICKTOOLS_POWERSHELL:'; $pos=$raw.LastIndexOf($marker); if ($pos -lt 0) { throw 'Falhou ao localizar o corretor' }; Invoke-Expression $raw.Substring($pos+$marker.Length) } catch { Write-Host ''; Write-Host ('ERRO: ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }"
set "CG_RESULT=%ERRORLEVEL%"
echo.
if "%CG_RESULT%"=="0" (echo CONCLUIDO. Confira o GitHub Desktop.) else (echo CORRECAO NAO CONCLUIDA. Leia a mensagem acima.)
echo.
pause
exit /b %CG_RESULT%
:CLICKTOOLS_POWERSHELL:
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Say([string]$msg) { Write-Host $msg }
function Fail([string]$msg) { throw $msg }

# The three reconciled source files are embedded; no downloads or network requests.
$encoded = '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'
$bytes = [Convert]::FromBase64String($encoded)
$stream = New-Object IO.MemoryStream(,$bytes)
$gunzip = New-Object IO.Compression.GzipStream($stream, [IO.Compression.CompressionMode]::Decompress)
$reader = New-Object IO.StreamReader($gunzip, [Text.Encoding]::UTF8)
$items = ConvertFrom-Json $reader.ReadToEnd()
$reader.Dispose(); $gunzip.Dispose(); $stream.Dispose()

$git = $null
$findGit = Get-Command git.exe -ErrorAction SilentlyContinue
if ($findGit) { $git = $findGit.Source }
if (-not $git) {
  $gitPaths = @(
    (Join-Path $env:ProgramFiles 'Git\cmd\git.exe'),
    (Join-Path $env:ProgramFiles 'Git\bin\git.exe')
  )
  if ($env:LOCALAPPDATA) {
    $gitPaths += @(Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'GitHubDesktop\app-*\resources\app\git\cmd\git.exe') -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | ForEach-Object FullName)
  }
  foreach ($candidate in $gitPaths) { if ($candidate -and (Test-Path -LiteralPath $candidate)) { $git = $candidate; break } }
}
if (-not $git) { Fail 'Nao encontrei o Git instalado. O GitHub Desktop precisa estar instalado.' }

$docs = [Environment]::GetFolderPath('MyDocuments')
$repoCandidates = @(
  $env:CG_FIX_DIR,
  (Join-Path $docs 'GitHub\clicktools'),
  (Join-Path $env:USERPROFILE 'Documents\GitHub\clicktools'),
  (Join-Path $env:USERPROFILE 'OneDrive\Documents\GitHub\clicktools'),
  (Join-Path $env:USERPROFILE 'OneDrive\Documentos\GitHub\clicktools')
)
$repo = $null
foreach ($candidate in $repoCandidates) {
  if ($candidate -and (Test-Path -LiteralPath (Join-Path $candidate '.git'))) { $repo = $candidate; break }
}
if (-not $repo) {
  Add-Type -AssemblyName System.Windows.Forms
  $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
  $dlg.Description = 'Selecione a pasta do repositorio clicktools (Documents > GitHub > clicktools)'
  if ($dlg.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { Fail 'Nenhuma pasta escolhida.' }
  $repo = $dlg.SelectedPath
}
if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) { Fail 'A pasta escolhida nao e o repositorio Git original.' }
$repo = [IO.Path]::GetFullPath($repo)
Say ('Repositorio: ' + $repo)
$mergeHead = & $git -C $repo rev-parse -q --verify MERGE_HEAD 2>$null
if ($LASTEXITCODE -ne 0 -or -not $mergeHead) { Fail 'O Git nao esta com um merge pendente. Nao alterei nada.' }

$lines = @(& $git -C $repo ls-files -u)
if ($LASTEXITCODE -ne 0) { Fail 'Nao foi possivel consultar conflitos do Git.' }
$unmerged = @($lines | Where-Object { $_ } | ForEach-Object { ($_ -split "`t",2)[1] } | Sort-Object -Unique)
$expected = @($items | ForEach-Object path | Sort-Object)
if ($unmerged.Count -ne 3 -or @($unmerged | Where-Object { $_ -notin $expected }).Count -gt 0) {
  Fail ('Encontrei conflitos diferentes dos 3 esperados (' + ($unmerged -join ', ') + '). Nao alterei nada por seguranca.')
}

$temp = Join-Path $env:TEMP ('CLICKTOOLS_MERGE_' + (Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $temp -Force | Out-Null
$utf8 = New-Object Text.UTF8Encoding($false)
$operations = @()

function Export-Blob([string]$sha, [string]$destination) {
  $err = $destination + '.err'
  $args = '-C "' + $repo + '" cat-file blob ' + $sha
  $p = Start-Process -FilePath $git -ArgumentList $args -Wait -PassThru -NoNewWindow -RedirectStandardOutput $destination -RedirectStandardError $err
  if ($p.ExitCode -ne 0) { Fail ('Nao foi possivel ler a versao do Git (' + $sha + ').') }
}

# Prepare all three files BEFORE changing the working tree.
foreach ($item in $items) {
  $path = [string]$item.path
  $stage2 = $null; $stage3 = $null
  foreach ($line in $lines) {
    if ($line -match '^[0-9]+\s+([0-9a-f]{40})\s+([23])\t(.+)$' -and $Matches[3] -eq $path) {
      if ($Matches[2] -eq '2') { $stage2 = $Matches[1] } else { $stage3 = $Matches[1] }
    }
  }
  if (-not $stage2 -or -not $stage3) { Fail ('Faltou um lado do conflito: ' + $path) }
  $num = $operations.Count
  $candidate = Join-Path $temp ('resolved_' + $num + '.txt')
  $baseFile = Join-Path $temp ('base_' + $num + '.txt')
  [IO.File]::WriteAllText($candidate, [string]$item.final, $utf8)
  [IO.File]::WriteAllText($baseFile, [string]$item.base, $utf8)
  if (($stage2 -eq $item.base_hash -and $stage3 -eq $item.final_hash) -or
      ($stage3 -eq $item.base_hash -and $stage2 -eq $item.final_hash) -or
      ($stage2 -eq $item.base_hash -and $stage3 -eq $item.base_hash)) {
    # The finished Bocao code already contains all original remote functionality.
  } elseif (($stage2 -eq $item.base_hash) -or ($stage3 -eq $item.base_hash)) {
    # An unexpected additional edit: try a non-conflicting three-way merge.
    $other = if ($stage2 -eq $item.base_hash) { $stage3 } else { $stage2 }
    $otherFile = Join-Path $temp ('other_' + $num + '.txt')
    $mergedFile = Join-Path $temp ('auto_merged_' + $num + '.txt')
    Export-Blob $other $otherFile
    $mergeArgs = 'merge-file -p "' + $candidate + '" "' + $baseFile + '" "' + $otherFile + '"'
    $p = Start-Process -FilePath $git -ArgumentList $mergeArgs -Wait -PassThru -NoNewWindow -RedirectStandardOutput $mergedFile
    if ($p.ExitCode -ne 0) { Fail ('As versoes de ' + $path + ' diferem alem do esperado; nao sobrescrevi alteracoes adicionais. Backup: ' + $temp) }
    $candidate = $mergedFile
  } else {
    Fail ('Ambos os lados de ' + $path + ' tem mudancas nao reconhecidas. Nao sobrescrevi alteracoes adicionais. Informe este diagnostico: ' + $temp)
  }
  $content = [IO.File]::ReadAllText($candidate, [Text.Encoding]::UTF8)
  if ($content -match '(?m)^(<<<<<<< |=======\s*$|>>>>>>> )') { Fail ('Marcadores de conflito detectados em ' + $path) }
  $operations += [pscustomobject]@{path=$path; candidate=$candidate}
}

# Back up the original conflicted working-tree files outside the repository.
$backup = Join-Path $temp 'backup'
foreach ($op in $operations) {
  $from = Join-Path $repo ($op.path -replace '/', [IO.Path]::DirectorySeparatorChar)
  $dest = Join-Path $backup ($op.path -replace '/', [IO.Path]::DirectorySeparatorChar)
  $dir = Split-Path -Parent $dest
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  [IO.File]::Copy($from, $dest, $true)
}
Say ('Backup: ' + $backup)

foreach ($op in $operations) {
  $target = Join-Path $repo ($op.path -replace '/', [IO.Path]::DirectorySeparatorChar)
  [IO.File]::Copy($op.candidate, $target, $true)
  & $git -C $repo add -- $op.path | Out-Null
  if ($LASTEXITCODE -ne 0) { Fail ('Falha ao adicionar ' + $op.path + '. Backup: ' + $backup) }
  Say ('Resolvido: ' + $op.path)
}
$remaining = @(& $git -C $repo ls-files -u)
if ($remaining.Count -gt 0 -and $remaining[0]) { Fail ('Ainda existem conflitos. Backup: ' + $backup) }
& $git -C $repo commit --no-edit
if ($LASTEXITCODE -ne 0) { Fail ('Os tres arquivos foram corrigidos, mas o commit automatico falhou. Abra o GitHub Desktop e clique Continue merge. Backup: ' + $backup) }
Say ''
Say 'SUCESSO: merge concluido sem descartar a outra versao.'
Say 'Agora basta clicar em Push origin no GitHub Desktop, quando desejar.'
Say 'Nenhum push nem deploy foi feito por este corretor.'
