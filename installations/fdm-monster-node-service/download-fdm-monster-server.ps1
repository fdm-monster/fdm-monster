git clone https://github.com/fdm-monster/fdm-monster.git --branch 1.2.4

cd fdm-monster
git fetch --prune

cd server
npm install --global yarn
yarn -v
yarn install --production --pure-lockfile

cd ../../
node ./run_fdm_service.js
