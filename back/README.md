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
All endpoints support path ID selected by appending `/{id}`

- api/cars
- api/enums
- api/reservations
- api/payments
- api/users

## Query Parameters
Endpoints also support query parameters by appending `?param1=abc&param2=50&param3=x,y,z` <br>
Query params commonly supported include searching, sorting, selecting, and filtering

When adding searchable fields in entities:

1. Add `@SearchField` annotation on String type attributes
2. ~~Manually run: `ALTER TABLE <table> ADD FULLTEXT INDEX ft_index(<columns>);`~~
3. ~~If you want to include a JSON column, you must create a hidden internal generated column converting JSON to plaintext to index it~~

## Creating an Entity Endpoint
Follow these steps when creating a new entity endpoint

**NOTE**: No longer using `@JsonBackReference`

1. Create your entity class in its package
   - Extend the `APIEntity` superclass
2. Add `jakarta.persistence` annotations:
   - For the class: `@Entity @Table(name = "dbTableName")`
   - For the ID attribute (long type recommended): `@Id`
   - For simple IDs: `@GeneratedValue(strategy = GenerationType.IDENTITY)`
   - Required attributes: `@Column(nullable = false)`
   - Enum attributes: `@Enumerated(EnumType.STRING)`
   - Searchable (String) attributes: `@SearchField`
   - JSON attributes: (requires a Converter to be made)
     - `@Convert(converter = Converters.JsonMYOBJECTConverter.class)`
     - `@Column(columnDefinition = "json", nullable = false)`
   - Foreign entity reference: (from the entity referencing another)
     - `@ManyToOne`
     - `@JoinColumn(name = "foreignKeyAttrName", nullable = false)`
   - Foreign entity referencing this: (from the entity being referenced) 
     - `@OneToMany(mappedBy = "thisAttrNameOnMainEntity") @JsonManagedReference("yourUniqueSharedIdentifier")`
   - Foreign entity reference: (ManyToMany from the entity referencing)
```java
      @ManyToMany
      @JoinTable(name = "reservationPayments",
              joinColumns = @JoinColumn(name = "mainEntityKeyAttrName"),
              inverseJoinColumns = @JoinColumn(name = "foreignEntityKeyAttrName")
      )
```
3. Create constructors:
   - Must include an empty constructor
   - Include a full/near full constructor (don't try to set values generated, mapped by, or otherwise managed by the database)
   - Include an ID processing constructor:
```java
      public Payment(long id) throws IllegalAccessException {
         Payment p = (Payment) DatabaseController.getOne(Payment.class, id);
         EntityController.copyFields(p, this);
      }
```
4. Create getters/setters that make sense
   - Warning: *All* getters will be run and returned in API get requests
     - Use `@JsonIgnore` to prevent a getter from being returned
     - Create extra getters for the API that return foreign entity IDs and objects if `parseFullObjects`
     - See example below, this allows the API to return IDs normally and objects if the above query param is set
   - Setters provided will be used by API create/update requests
       - Don't create setters for values that are mapped by another entity or generated
```java
      @JsonIgnore
      public User getUser() {
          return user;
      }
      @JsonProperty("user")
      public Object getUserParse() {
          if (parseFullObjects) return user;
          else return user.getUserId();
      }
```
5. Register your entity in the file `utils/HibernateUtil`
   - `configuration.addAnnotatedClass(YourEntityClass.class);`
6. Register your entity APIController in Main (Long.class represents the entity's key type)
   - `APIController yourEntities = new APIController(YourEntityClass.class, Long.class);`
7. Register your entity's API endpoints and access in Main
```java
      path("yourEntities", () -> {
         get(yourEntities::getAll, Role.ANYONE);
         post(yourEntities::create, Role.WRITE);
         path("{id}", () -> {
            get(yourEntities::getOne, Role.ANYONE);
            patch(yourEntities::update, Role.WRITE);
            delete(yourEntities::delete, Role.ADMIN);
         });
      });
```
