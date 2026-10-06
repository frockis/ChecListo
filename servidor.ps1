param(
  [switch]$SemNavegador
)

$ErrorActionPreference = "Stop"
$porta = 4173
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$registro = Join-Path $raiz "dados\registro.json"
$utf8 = New-Object System.Text.UTF8Encoding $false

New-Item -ItemType Directory -Force -Path (Join-Path $raiz "dados") | Out-Null
if (-not (Test-Path $registro)) {
  [System.IO.File]::WriteAllText($registro, "{}" + [Environment]::NewLine, $utf8)
}

Add-Type -AssemblyName System.Web.Extensions
$serial = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$serial.MaxJsonLength = 10485760

function Responder {
  param($Contexto, [int]$Status, [string]$Tipo, [byte[]]$Bytes)
  $resposta = $Contexto.Response
  $resposta.StatusCode = $Status
  $resposta.ContentType = $Tipo
  $resposta.KeepAlive = $false
  $resposta.Headers["Cache-Control"] = "no-store"
  $resposta.ContentLength64 = $Bytes.LongLength
  if ($Bytes.LongLength -gt 0) {
    $resposta.OutputStream.Write($Bytes, 0, $Bytes.Length)
  }
  $resposta.OutputStream.Close()
}

function ResponderTexto {
  param($Contexto, [int]$Status, [string]$Tipo, [string]$Texto)
  Responder $Contexto $Status $Tipo ($utf8.GetBytes($Texto))
}

function ResponderArquivo {
  param($Contexto, [string]$Caminho, [string]$Tipo)
  if (-not (Test-Path $Caminho)) {
    ResponderTexto $Contexto 404 "text/plain; charset=utf-8" "nao encontrado"
    return
  }
  Responder $Contexto 200 $Tipo ([System.IO.File]::ReadAllBytes($Caminho))
}

function Ler-Corpo {
  param($Requisicao)
  $tamanho = [int]$Requisicao.ContentLength64
  if ($tamanho -le 0) { return "" }
  if ($tamanho -gt 2000000) { throw "corpo grande" }
  $buffer = New-Object byte[] $tamanho
  $lido = 0
  $fluxo = $Requisicao.InputStream
  while ($lido -lt $tamanho) {
    $n = $fluxo.Read($buffer, $lido, $tamanho - $lido)
    if ($n -le 0) { break }
    $lido += $n
  }
  return $utf8.GetString($buffer, 0, $lido)
}

$ouvinte = New-Object System.Net.HttpListener
$ouvinte.Prefixes.Add("http://127.0.0.1:$porta/")
try {
  $ouvinte.Start()
} catch {
  Write-Host "Nao consegui abrir a porta $porta. Feche a outra janela do checklist e tente de novo."
  Write-Host $_.Exception.Message
  exit 1
}

$url = "http://127.0.0.1:$porta/"
Write-Host "Checklist em $url"
Write-Host "Feche esta janela para encerrar."
if (-not $SemNavegador) {
  Start-Process $url
}

try {
  while ($ouvinte.IsListening) {
    try {
      $ctx = $ouvinte.GetContext()
    } catch {
      break
    }

    try {
      $req = $ctx.Request
      $caminho = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
      $metodo = $req.HttpMethod

      if ($metodo -eq "GET" -and ($caminho -eq "/" -or $caminho -eq "/index.html")) {
        ResponderArquivo $ctx (Join-Path $raiz "public\index.html") "text/html; charset=utf-8"
      }
      elseif ($metodo -eq "GET" -and $caminho -eq "/style.css") {
        ResponderArquivo $ctx (Join-Path $raiz "public\style.css") "text/css; charset=utf-8"
      }
      elseif ($metodo -eq "GET" -and $caminho -eq "/app.js") {
        ResponderArquivo $ctx (Join-Path $raiz "public\app.js") "text/javascript; charset=utf-8"
      }
      elseif ($metodo -eq "GET" -and $caminho -eq "/atividades.js") {
        ResponderArquivo $ctx (Join-Path $raiz "atividades.js") "text/javascript; charset=utf-8"
      }
      elseif ($metodo -eq "GET" -and $caminho -eq "/favicon.ico") {
        Responder $ctx 204 "image/x-icon" ([byte[]]@())
      }
      elseif ($metodo -eq "GET" -and $caminho -eq "/api/registro") {
        $texto = [System.IO.File]::ReadAllText($registro, $utf8)
        if ([string]::IsNullOrWhiteSpace($texto)) { $texto = "{}" }
        ResponderTexto $ctx 200 "application/json; charset=utf-8" $texto
      }
      elseif ($metodo -eq "POST" -and $caminho -eq "/api/registro") {
        $corpo = Ler-Corpo $req
        $obj = $serial.DeserializeObject($corpo)
        $ehLista = $obj -is [System.Array]
        $ehObjeto = $obj -is [System.Collections.IDictionary]
        if (-not $ehObjeto -or $ehLista) {
          ResponderTexto $ctx 400 "application/json; charset=utf-8" '{"erro":"o registro precisa ser um objeto"}'
        } else {
          $texto = $corpo.Trim() + [Environment]::NewLine
          [System.IO.File]::WriteAllText($registro, $texto, $utf8)
          Write-Host ("registro atualizado " + (Get-Date -Format "HH:mm:ss"))
          ResponderTexto $ctx 200 "application/json; charset=utf-8" '{"ok":true}'
        }
      }
      else {
        ResponderTexto $ctx 404 "text/plain; charset=utf-8" "nao encontrado"
      }
    } catch {
      Write-Host ("erro: " + $_.Exception.Message)
      try {
        ResponderTexto $ctx 500 "application/json; charset=utf-8" '{"erro":"erro interno"}'
      } catch {}
    }
  }
} finally {
  if ($ouvinte.IsListening) { $ouvinte.Stop() }
  $ouvinte.Close()
}
