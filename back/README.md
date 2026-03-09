# Backend Documentation

# Running with Docker

```bash
docker build -t fcr-backend .
docker run -p 8080:8080 fcr-backend
```

# Running with Maven Build
1. Make sure your env is up to date from the `pom.xml` (should be an icon top right in the pom file)
2. Add env variables to maven runner in settings:
   - `File / Settings / Build, Execution, Deployment / Build Tools / Maven / Runner`
3. Open "maven" panel top right bar, 
   - Right click `Lifecycle / package` and add to "Execute Before Build"
   - Right click `Plugins / exec / exec:java` and add to "Execute After Build"
4. DONT use the deprecated run configurations under `/back/.run/`
5. DO use `Build / Build Project` (Ctrl + F9) or hammer icon bottom left 