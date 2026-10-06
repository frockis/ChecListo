@echo off
title Checklist Diario
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
if errorlevel 1 (
  echo.
  echo O checklist encerrou com erro.
  pause
)
