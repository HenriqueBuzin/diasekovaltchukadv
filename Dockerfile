# Dockerfile

FROM python:3.11.3-slim-buster as develop-stage
WORKDIR /diasekovaltchukadv
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
WORKDIR /diasekovaltchukadv/src
