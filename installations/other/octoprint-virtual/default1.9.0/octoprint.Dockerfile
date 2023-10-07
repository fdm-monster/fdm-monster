# Extend octoprint/octoprint:1.9.0 image with a copied folder default1.9.0 from the context to /octoprint

FROM octoprint/octoprint:1.9.2

COPY ./octoprint /octoprint-seed

COPY ./run /etc/services.d/octoprint/run


