#requires -version 5.1
# ClickTools - recuperação conservadora do repositório local.
# Nenhuma operação destrutiva é executada ANTES de criar uma cópia de segurança completa.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$ExpectedHead = '71a816cd7f196d5dc707248cc5e9b75af306d1c0'
$ExpectedOrigin = 'viniciusspgo2-creator/clicktools'
$Payload = Join-Path $PSScriptRoot 'CLICKTOOLS_FULL'
$GitExe = $null
$Repo = $null
$Backup = $null
$RecoveryBranch = $null
function Say([string]$message) { Write-Host "`n$message" -ForegroundColor Cyan }
function Git([string[]] $GitArgs) {
    & $script:GitExe -C $script:Repo @GitArgs
    if ($LASTEXITCODE -ne 0) { throw "Git falhou ($LASTEXITCODE): git $($GitArgs -join ' ')" }
}
function LocateGit {
    $fromPath = Get-Command 'git.exe' -ErrorAction SilentlyContinue
    if ($fromPath) { return $fromPath.Source }
    $basePath = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
    $candidates = @(Get-ChildItem -Path $basePath -Directory -Filter 'app-*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending)
    foreach ($candidate in $candidates) {
        foreach ($relative in @('resources\app\git\cmd\git.exe', 'resources\app\git\mingw64\bin\git.exe', 'resources\app\git\bin\git.exe')) {
            $p = Join-Path $candidate.FullName $relative
            if (Test-Path -LiteralPath $p) { return $p }
        }
    }
    throw 'Nao localizei o Git. Instale Git para Windows ou abra o projeto pelo GitHub Desktop e use o Git instalado.'
}
try {
    Say 'CLICKTOOLS | RECUPERACAO SEGURA DO PROJETO'
    if (!(Test-Path -LiteralPath (Join-Path $Payload 'package.json'))) { throw 'Arquivos do projeto nao encontrados ao lado do reparador.' }
    $GitExe = LocateGit
    Add-Type -AssemblyName System.Windows.Forms
    $picker = New-Object System.Windows.Forms.FolderBrowserDialog
    $picker.Description = 'Selecione a pasta atual do CLICKTOOLS usada no GitHub Desktop (que contem .git e package.json)'
    $picker.ShowNewFolderButton = $false
    if ((Test-Path -LiteralPath (Join-Path $PSScriptRoot '.git')) -and (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'package.json'))) {
        $Repo = $PSScriptRoot
        Say "Pasta detectada: $Repo"
    } else {
        if ($picker.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { throw 'Operacao cancelada. NENHUM arquivo foi modificado.' }
        $Repo = $picker.SelectedPath
    }
    if (!(Test-Path -LiteralPath (Join-Path $Repo '.git')) -or !(Test-Path -LiteralPath (Join-Path $Repo 'package.json'))) {
        throw 'A pasta escolhida nao contem .git e package.json. Nada foi alterado.'
    }
    $found = (& $GitExe -C $Repo rev-parse --show-toplevel 2>&1)
    if ($LASTEXITCODE -ne 0) { throw 'A pasta escolhida nao e um repositorio Git valido.' }
    $Repo = [System.IO.Path]::GetFullPath(([string]$found).Trim())
    $origin = (& $GitExe -C $Repo remote get-url origin 2>&1)
    if ($LASTEXITCODE -ne 0 -or !([string]$origin -match 'github\.com[:/]viniciusspgo2-creator/clicktools(?:\.git)?/?$')) {
        throw "Repositoro inesperado: $origin . Este reparador e somente para $ExpectedOrigin."
    }
    # Evita copiar a pasta de backup para dentro dela mesma.
    $parent = Split-Path -Parent $Repo
    $basename = Split-Path -Leaf $Repo
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $Backup = Join-Path $parent ("$basename-BACKUP-ANTES-DO-REPARO-$stamp")
    if (Test-Path -LiteralPath $Backup) { throw 'Uma pasta de backup com esse nome ja existe.' }
    Say "1/6 - Fazendo backup completo de codigo, .git e arquivos .env em $Backup"
    New-Item -ItemType Directory -Path $Backup -Force | Out-Null
    & robocopy $Repo $Backup /E /XJ /R:1 /W:1 /NP /NFL /NDL /XD node_modules .next .turbo .vercel .cache out build  | Out-Null
    $robocopyCode = $LASTEXITCODE
    if ($robocopyCode -ge 8 -or !(Test-Path -LiteralPath (Join-Path $Backup '.git'))) {
        throw "Backup nao foi concluido (codigo $robocopyCode); NENHUMA alteracao foi feita na pasta de trabalho."
    }
    # A partir daqui o estado local fica recuperavel no backup, inclusive commits locais.
    Say '2/6 - Encerrando Merge/Rebase antigo, caso exista'
    & $GitExe -C $Repo merge --abort 2>$null | Out-Null
    & $GitExe -C $Repo rebase --abort 2>$null | Out-Null
    $RecoveryBranch = "resgate/clicktools-antes-reparo-$stamp"
    Git @('branch', $RecoveryBranch, 'HEAD')
    Say "Commits locais preservados na branch: $RecoveryBranch"
    Say '3/6 - Conferindo a versao oficial da main no GitHub'
    Git @('fetch','origin','main')
    $remoteHead = (& $GitExe -C $Repo rev-parse 'refs/remotes/origin/main').Trim()
    if ($LASTEXITCODE -ne 0 -or $remoteHead -ne $ExpectedHead) {
        throw "A main do GitHub mudou desde a auditoria ($remoteHead). Parei para nao sobrescrever novidades. Backup: $Backup"
    }
    Say '4/6 - Restaurando a main remota SEM criar um Merge'
    $currentBranch = (& $GitExe -C $Repo symbolic-ref --quiet --short HEAD 2>$null)
    if ($currentBranch -ne 'main') { Git @('checkout','-B','main','origin/main') }
    Git @('reset','--hard','origin/main')
    Say '5/6 - Aplicando os arquivos completos revisados do ClickTools'
    & robocopy $Payload $Repo /E /XJ /R:1 /W:1 /NP /NFL /NDL | Out-Null
    if ($LASTEXITCODE -ge 8) { throw 'Falha na copia dos novos arquivos. O backup permanece intacto.' }
    # Staging explicitamente restrito aos arquivos do payload: evita publicar arquivos privados extras.
    $allFiles = @(Get-ChildItem -LiteralPath $Payload -Recurse -File -Force)
    $prefix = $Payload.TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
    $paths = @($allFiles | ForEach-Object { $_.FullName.Substring($prefix.Length).Replace('\','/') })
    for ($i=0; $i -lt $paths.Count; $i+=50) {
        $chunk = @($paths[$i..([Math]::Min($i+49,$paths.Count-1))])
        Git (@('add','--') + $chunk)
    }
    & $GitExe -C $Repo diff --cached --quiet
    if ($LASTEXITCODE -eq 1) {
        Git @('commit','-m','ClickTools: integra Admin universal, home, audio e UI sem merge conflitante')
    } elseif ($LASTEXITCODE -ne 0) {
        throw 'Nao consegui validar os arquivos preparados para o commit.'
    }
    Say '6/6 - Enviando a nova revisao ao GitHub SEM force push'
    Git @('push','origin','main')
    Write-Host "`nSUCESSO: ClickTools atualizado no GitHub!" -ForegroundColor Green
    Write-Host "Backup integral: $Backup"
    Write-Host "Branch de resgate dos commits antigos: $RecoveryBranch"
    Write-Host 'Se houver erro de compilacao na Vercel, preserve o log para diagnostico.'
} catch {
    Write-Host "`nREPARO INTERROMPIDO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Nao apague o backup. Nenhum force push foi feito.' -ForegroundColor Yellow
    if ($Backup) { Write-Host "Backup (se criado): $Backup" }
    exit 1
} finally {
    Write-Host "`nPressione ENTER para fechar..."
    [void][Console]::ReadLine()
}
