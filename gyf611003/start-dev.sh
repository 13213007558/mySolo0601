#!/bin/bash
cd /Users/guo/pro/solo/workspaces/gyf611003
export PORT=5173
exec npx remix-serve build/server/index.js
