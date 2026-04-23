@echo off
color 0A
echo ==============================================
echo =    KHOI DONG HE THONG MEDCARE MICROSERVICES    =
echo ==============================================

set "JAVA_HOME=%USERPROFILE%\.jdks\ms-21.0.9"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd BE

echo [1] Dang chay Discovery Server (Eureka)...
start "Eureka Server (8761)" cmd /k "gradlew discovery-server:bootRun"

echo Doi 15 giay cho Eureka khoi dong xong...
timeout /t 15

echo [2] Dang chay API Gateway (8080)...
start "API Gateway (8080)" cmd /k "gradlew api-gateway:bootRun"

echo [3] Dang chay User Service (8081)...
start "User Service (8081)" cmd /k "gradlew user-service:bootRun"

echo [4] Dang chay Auth Service (8082)...
start "Auth Service (8082)" cmd /k "gradlew auth-service:bootRun"

echo [5] Dang chay Product Service (8083)...
start "Product Service (8083)" cmd /k "gradlew product-service:bootRun"

echo [6] Dang chay Review Service (8085)...
start "Review Service (8085)" cmd /k "gradlew review-service:bootRun"

echo [7] Dang chay Order Service / Cart (8086)...
start "Order Service (8086)" cmd /k "gradlew order-service:bootRun"

echo [8] Dang chay Promotion Service (8087)...
start "Promotion Service (8087)" cmd /k "gradlew promotion-service:bootRun"

echo [9] Dang chay Inventory Service (8084)...
start "Inventory Service (8084)" cmd /k "gradlew inventory-service:bootRun"

echo [10] Dang chay Shipping Service (8088)...
start "Shipping Service (8088)" cmd /k "gradlew shipping-service:bootRun"

echo [11] Dang chay Payment Service (8089)...
start "Payment Service (8089)" cmd /k "gradlew payment-service:bootRun"

echo ==============================================
echo =       Tat ca cac service da duoc goi!      =
echo ==============================================
color 07
