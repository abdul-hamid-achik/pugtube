if [ "$NODE_ENV" = "development" ]; then
    npm install
    npm run dev
else
    node server.js
fi
