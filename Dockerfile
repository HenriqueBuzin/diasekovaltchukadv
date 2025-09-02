# Dockerfile

FROM python:3.11.3-slim-buster

WORKDIR /src

COPY requirements.txt /tmp/requirements.txt
RUN pip3 install -r /tmp/requirements.txt

COPY src/ /src/

CMD ["python3", "main.py"]
