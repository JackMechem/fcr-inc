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


# Status Codes
1. 1xx - Request received, but no response yet
2. 2xx - Request received = Success series:
   - 200 Ok (successfully retrieved)
   - 201 Created (successfully)
   - 204 No Content (nothing to return)
3. 3xx - Requested resource elsewhere, separate call necessary = Redirection series:
   - 300 needs user interaction for selecting an option
   - 301 moved permanently
   - 302 found
4. 4xx - Request can't be done because of user error = Bad Request/Client Error series:
   - 400 Bad Request (invalid parameters or malformed JSON)
   - 401 Unauthorized
   - 404 Not Found (product doesn't exist)
5. 5xx - Request not completed because of issues on server end = Server Error series:
   - 500 Internal Server Error (unexpected server-side failure)


# API Structure
api/cars/{vin}

