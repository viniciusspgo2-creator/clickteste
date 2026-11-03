@echo off
chcp 65001 > nul
title RECUPERAR CLICKTOOLS - SEM MERGE
cd /d "%~dp0"
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0CORRIGIR-CLICKTOOLS.ps1"
if errorlevel 1 (
  echo.
  echo O reparador registrou um problema. Nao tente usar Pull / Merge.
  pause
)
