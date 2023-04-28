npm run uninstall

cd fdm-monster
git fetch --prune
$tag = git describe --tags --abbrev=0
git switch --detach $tag

cd server
npm install --global yarn
yarn -v
yarn install --production --pure-lockfile

cd ../../
node ./install-fdm-monster-service.js
