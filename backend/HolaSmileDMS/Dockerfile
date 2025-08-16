# ===== Build stage =====
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1) COPY riêng các csproj cần thiết để tận dụng cache
COPY Application/Application.csproj Application/
COPY Domain/Domain.csproj Domain/
COPY Infrastructure/Infrastructure.csproj Infrastructure/
COPY HDMS_API/HDMS_API.csproj HDMS_API/

# 2) Restore trực tiếp project API (sẽ tự kéo dependency từ các csproj trên)
RUN dotnet restore HDMS_API/HDMS_API.csproj

# 3) COPY toàn bộ source rồi publish
COPY . .
RUN dotnet publish HDMS_API/HDMS_API.csproj -c Release -o /app -p:UseAppHost=false

# ===== Runtime stage =====
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Cài wkhtmltopdf + deps và tải thư viện native từ source
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    libgdiplus \
    libxext6 \
    libxrender1 \
    libfontconfig1 \
    fontconfig \
    ca-certificates \
    libx11-6 \
    libxcb1 \
    libxau6 \
    libxdmcp6 \
    && wget -q -O wkhtmltox.deb https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-3/wkhtmltox_0.12.6.1-3.bookworm_amd64.deb \
    && dpkg -i wkhtmltox.deb || apt-get install -y -f \
    && rm wkhtmltox.deb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Tạo symlink libwkhtmltox.so (không hậu tố) → trỏ tới file thật có hậu tố
RUN set -eux; \
    ldir="/usr/lib/x86_64-linux-gnu"; \
    real="$(ls -1 ${ldir}/libwkhtmltox.so.* | head -n1)"; \
    ln -sf "$real" "${ldir}/libwkhtmltox.so" || true

# Copy app đã publish
COPY --from=build /app .

# Tạo thư mục certificate và tạo certificate đơn giản
RUN mkdir -p /root/.aspnet/https /root/.aspnet/DataProtection-Keys && \
    openssl req -x509 -newkey rsa:2048 -keyout /root/.aspnet/https/aspnetapp.key -out /root/.aspnet/https/aspnetapp.crt -days 365 -nodes -subj "/CN=localhost" && \
    openssl pkcs12 -export -out /root/.aspnet/https/aspnetapp.pfx -inkey /root/.aspnet/https/aspnetapp.key -in /root/.aspnet/https/aspnetapp.crt -passout pass: && \
    chmod 600 /root/.aspnet/https/aspnetapp.pfx

# (tuỳ chọn) giúp linker tìm thư viện nhanh hơn
ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH}

# Configure HTTPS với password rỗng
ENV ASPNETCORE_URLS=https://+:5001
ENV ASPNETCORE_Kestrel__Certificates__Default__Password=""
ENV ASPNETCORE_Kestrel__Certificates__Default__Path=/root/.aspnet/https/aspnetapp.pfx
ENV ASPNETCORE_ENVIRONMENT=Development
EXPOSE 5001
ENTRYPOINT ["dotnet","HDMS_API.dll"]
