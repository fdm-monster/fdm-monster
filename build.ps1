$build = "build140224"
docker build --platform=linux/arm64 --push -f .\docker\alpha.Dockerfile -t davidzwa/fdm-monster:1.6.0-sqlite-arm64-$build .
docker build --platform=linux/arm64 --push -f .\docker\alpha.Dockerfile -t fdmmonster/fdm-monster:1.6.0-sqlite-arm64-$build .
docker build --platform=linux/arm64 --push -f .\docker\Dockerfile -t davidzwa/fdm-monster:1.6.0-arm64-$build .
docker build --platform=linux/arm64 --push -f .\docker\Dockerfile -t fdmmonster/fdm-monster:1.6.0-arm64-$build .
