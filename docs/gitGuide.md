# Git Guide

## Basic Setup

```bash
git clone https://github.com/JackMechem/comp-380-project.git
```

## Making Contributions

### Run every time you want to make any changes

```
git pull origin main --rebase
```

### Make a feature branch

```
git checkout -b feature-branch
```

### Make a commit and push your changes

```
git add .
git commit -m "Changes XYZ..."
git push -u origin feature-branch
```
