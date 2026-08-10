@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Gerador do Instalador - Dashboard Senac
cls

echo ========================================================
echo        GERADOR DO INSTALADOR - DASHBOARD SENAC
echo ========================================================
echo.

if not exist "Dashboard_V76.html" (
    echo [ERRO] Dashboard_V76.html nao encontrado nesta pasta.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js e npm nao foram encontrados.
    echo Instale o Node.js antes de gerar uma nova versao.
    pause
    exit /b 1
)

echo [1/3] Conferindo dependencias...
call npm install
if errorlevel 1 goto :erro

for /f "delims=" %%V in ('node -p "require('./package.json').version"') do set "APP_VERSION=%%V"
if not defined APP_VERSION goto :erro

set "BUILD_OUT=%TEMP%\dashboard-senac-build-%RANDOM%"
echo [2/3] Gerando instalador fora da pasta do OneDrive...
call node_modules\.bin\electron-builder.cmd --win nsis --config.directories.output="%BUILD_OUT%"
if errorlevel 1 goto :erro

if not exist "Instalador" mkdir "Instalador"
copy /y "%BUILD_OUT%\Dashboard-Senac-Setup-%APP_VERSION%.exe" "Instalador\Dashboard-Senac-Setup-%APP_VERSION%.exe" >nul
if errorlevel 1 goto :erro

echo [3/3] Instalador criado com sucesso.
echo.
echo Arquivo:
echo %CD%\Instalador\Dashboard-Senac-Setup-%APP_VERSION%.exe
echo.
pause
exit /b 0

:erro
echo.
echo [ERRO] Nao foi possivel gerar o instalador.
pause
exit /b 1
