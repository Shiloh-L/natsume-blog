# 通用服务镜像：通过构建参数 MODULE 指定要打包的微服务
# 构建上下文为 backend/ 目录
FROM eclipse-temurin:21-jre-jammy

ARG MODULE
ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY ${MODULE}/target/${MODULE}.jar /app/app.jar

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
