# [F.C.R _Fast Car Rentals_](https://fcr-inc.org/)

> CSUN COMP 380 Project | Abhishek Verma

**Group Members**

- Andrew Goldman
- Jack Mechem
- Jenny Ventura
- Roark Wanner-Ruffalo

<details>
    <summary><h2>Links</h2></summary>

## **Frontend Deplotment**

#### [www.fcr-inc.org](https://fcr-inc.org/)

## **Backend Deplotment**

### API
#### [api.fcr-inc.org](https://api.fcr-inc.org/)

### API Documentation
#### [api.fcr-inc.org/docs](https://api.fcr-inc.org/docs)

## Project Links

- [Jira](https://jack-mechem.atlassian.net/?continue=https%3A%2F%2Fjack-mechem.atlassian.net%2Fwelcome%2Fsoftware%3FprojectId%3D10000&atlOrigin=eyJpIjoiM2M3NDZkZDAzYTEwNGUwMThmZDQ2MzIyY2UyZTBjNGIiLCJwIjoiamlyYS1zb2Z0d2FyZSJ9)
- [Figma](https://www.figma.com/team_invite/redeem/nPJ156OfSjArJ9x80XV3CR?t=B5Q6Gqp3QpAIy14Y-21)

## Tutorial Links

- [Git/Github Crash Course](https://www.youtube.com/watch?v=mAFoROnOfHs)
- [Jira Intro](https://youtu.be/ekQOcHf8cBc)

</details>

## Project Description

### Prompt

A software that lets customers perform car rental online. Some functions of the software include logging in,
searching for a car, adding to cart, book, view booking, canceling, staff managing car pickup and return, and
generating some type of reports for the managers related to sales volume etc. The confirmation should be sent
to the customer via email. Optionally system lets customers leave a review.

### Tech Stack

#### Front End

- Framework: Next.js
- Styling: Tailwind CSS
- Package Manager: npm
- State Manager: Zustand

#### Back End

- Language: Java
- Networking Library: Javalin
- SQL Library: Hibernate
- Documentation: OpenAPI / Swagger (UI)

### Documentation

For API structure / routes see the [**documentation**](https://api.fcr-inc.org/docs) (authorization required).

## Contributions

_Note: Pushing changes directly to the main branch is disabled. Push your changes into a feature branch and create a pull request_

1. _Fork the repo if you don't have write access to the repo_
2. Create a feature branch
3. Push changes
4. Create a pull request
5. Have someone review your changes
6. Merge changes into main

## Versioning

### Version Format
This project follows [Semantic Versioning](https://semver.org/) with a pre-release tag: `MAJOR.MINOR.PATCH-alpha`

Example: `4.0.1-alpha`

### Source of Truth
Each project has its own `version.json` at its root, versioned independently:
- **Backend:** `back/version.json` — exposed at `GET /version`
- **Frontend:** `front/version.json`

To change a version, edit the `version.json` in that project. The backend API picks it up automatically at build time.

### When to Increment

| Change type | Bump | Example |
|---|---|---|
| Breaking change (removed/renamed endpoint, changed request/response shape) | **MAJOR** | `4.0.1` → `5.0.0-alpha` |
| New feature, endpoint, or entity added | **MINOR** | `4.0.1` → `4.1.0-alpha` |
| Bug fix, small tweak, config change | **PATCH** | `4.0.1` → `4.0.2-alpha` |

While in alpha, breaking changes can be a MINOR bump instead of MAJOR since the API is not yet stable.

### Dropping the Alpha Tag
Remove `-alpha` from the version in `version.json` when the project is stable and ready for production use.
