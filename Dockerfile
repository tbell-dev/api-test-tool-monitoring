# For K6
FROM ubuntu:22.04

# 필요한 라이브러리 설치 (예: ca-certificates, libc 등)
RUN apt-get update && apt-get install -y ca-certificates

# 호스트의 k6 바이너리 복사
COPY ./k6 /usr/bin/k6
RUN chmod +x /usr/bin/k6

WORKDIR /scripts

ENTRYPOINT ["/usr/bin/k6"]
CMD ["version"]

CMD ["run", "stress.js"]

