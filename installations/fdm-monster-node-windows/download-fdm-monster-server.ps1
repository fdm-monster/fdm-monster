git clone https://github.com/fdm-monster/fdm-monster.git --branch 1.3.1-rc2

cd fdm-monster
git fetch --prune

cd server
npm install --global yarn
yarn -v
yarn install --production --pure-lockfile

cd ../../
node ./install-fdm-monster-service.js
