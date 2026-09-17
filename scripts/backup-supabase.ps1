param(
  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_DB_URL) {
  throw "Defina SUPABASE_DB_URL com a connection string direta do Postgres antes de executar o backup."
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump não foi encontrado no PATH. Instale as ferramentas de cliente do PostgreSQL."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDir "sifcas-$timestamp.dump"

Write-Host "Gerando backup lógico do SIFCAS em $file..."
& pg_dump --dbname=$env:SUPABASE_DB_URL --format=custom --no-owner --no-privileges --file=$file
if ($LASTEXITCODE -ne 0) { throw "pg_dump terminou com código $LASTEXITCODE" }

Write-Host "Backup concluído: $file"
Write-Host "Guarde uma cópia criptografada fora do Supabase/Vercel."
