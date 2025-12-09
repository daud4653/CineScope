@echo off
echo ========================================
echo Setting up AI Recommendation System
echo ========================================
echo.

REM Check for Python 3.11 or 3.12
echo Checking for compatible Python version...
py -3.12 --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found Python 3.12
    set PYTHON_CMD=py -3.12
    goto install
)

py -3.11 --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found Python 3.11
    set PYTHON_CMD=py -3.11
    goto install
)

py -3.10 --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found Python 3.10
    set PYTHON_CMD=py -3.10
    goto install
)

echo.
echo ERROR: No compatible Python version found (3.10, 3.11, or 3.12)
echo.
echo Please install Python 3.12 from: https://www.python.org/downloads/release/python-3120/
echo Make sure to check "Add Python to PATH" during installation
echo.
pause
exit /b 1

:install
echo.
echo Installing TensorFlow and dependencies...
%PYTHON_CMD% -m pip install --upgrade pip
%PYTHON_CMD% -m pip install tensorflow numpy

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo SUCCESS! AI dependencies installed
    echo ========================================
    echo.
    echo Python version: 
    %PYTHON_CMD% --version
    echo.
    echo To verify TensorFlow:
    %PYTHON_CMD% -c "import tensorflow as tf; print('TensorFlow version:', tf.__version__)"
    echo.
) else (
    echo.
    echo ERROR: Installation failed
    echo.
)

pause

