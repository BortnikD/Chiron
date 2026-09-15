# Stage 1: build the Spring Boot fat jar
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Resolve Gradle wrapper and dependencies first so this layer is cached between source changes
COPY gradlew build.gradle.kts settings.gradle.kts ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null

COPY src src
RUN ./gradlew --no-daemon bootJar -x test \
    && cp "$(ls build/libs/*.jar | grep -v plain)" app.jar

# Stage 2: minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
