@echo off
echo Adding files...
git add .
if %errorlevel% neq 0 goto :error

echo Committing changes...
git commit -m "code upgrade"
if %errorlevel% neq 0 goto :error

echo Pushing to origin master...
git push origin master
if %errorlevel% neq 0 goto :error

echo Success! All changes pushed.
goto :end

:error
echo Error occurred during git operation!
pause
exit /b 1

:end
pause