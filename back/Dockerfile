FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/fcr-api-0.1.0-jar-with-dependencies.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
