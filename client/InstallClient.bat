@ECHO off
cd /d %~dp0
echo Config CNPM...
npm install -g cnpm --registry=https://registry.npm.taobao.org
echo Config CNPM Done!
echo Start install dependency...
cnpm install
echo Install dependency Done!