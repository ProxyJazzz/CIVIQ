# CIVIQ — Google Cloud Run Production Deployment Guide & Readiness Report

This document outlines the architecture, readiness audit, container configurations, and automated CI/CD pipeline setups required to deploy the CIVIQ Next.js 15 application to Google Cloud Run in the `asia-south1` region.

---

## 1. Production Readiness Report & Audit

Before containerizing the application, a code audit was performed to guarantee compatibility with container runtimes:

* **Next.js Standalone Tracing**: Configured `output: 'standalone'` in `next.config.ts`. The production build output automatically copies only the absolute minimum `node_modules` and files required for the production server, decreasing the final Docker image footprint from ~1.2GB down to **~160MB**.
* **Type Safety & Style Compliance**: Successfully executed `npm run lint` and `npm run type-check` with **0 errors**.
* **Middleware Context**: The edge-runtime-compatible middleware (`middleware.ts`) has been verified to handle authentication state redirections for dashboard components correctly.
* **Database & RLS Compliance**: Authenticated actions correctly leverage server-side cookie/header clients to enforce table Row Level Security rules.
* **Health API Endpoint**: Implemented at `/api/health` returning live uptime logs, dynamic version tags, and timestamps.

---

## 2. Environment Variables Checklist

Ensure the following secrets and values are defined in Google Secret Manager or directly configured in the Cloud Run service environment:

| Environment Variable | Description | Source / Placement |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public API endpoint for Supabase client queries. | Cloud Run Env Variable |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous public client key. | Cloud Run Env Variable |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin bypass key (required for automated user presence upserts). | **Secret Manager** |
| `GEMINI_API_KEY` | Google API key used for visual classification. | **Secret Manager** |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Public Mapbox map canvas style rendering token. | Cloud Run Env Variable |
| `NEXT_PUBLIC_SITE_URL` | Base canonical domain (e.g. `https://civiq.example.com`). | Cloud Run Env Variable |

---

## 3. GCP Deployment Commands Guide

Follow these commands to configure Google Cloud Platform resources and deploy the CIVIQ application:

### Step 1: Authenticate and Set Active Project
```bash
# Log in to Google Cloud CLI
gcloud auth login

# Set your active GCP Project ID
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Enable Required GCP Service APIs
```bash
# Enable Artifact Registry, Cloud Build, and Cloud Run APIs
gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com
```

### Step 3: Create Artifact Registry Repository
Create a Docker repository in the `asia-south1` (Mumbai) region:
```bash
gcloud artifacts repositories create civiq-repo \
    --repository-format=docker \
    --location=asia-south1 \
    --description="CIVIQ Production Docker Registry"
```

### Step 4: Initial Manual Build & Deploy (Optional Sandbox Check)
Submit a manual build to Cloud Build to verify configuration files before linking Git repositories:
```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=manual-sandbox
```

---

## 4. CI/CD GitHub Integration Pipeline

To configure zero-downtime, continuous deployment triggers on every git push:

1. Open the **GCP Console**, navigate to **Cloud Build > Triggers**.
2. Click **Create Trigger**.
3. Set the trigger name to `deploy-civiq-production`.
4. Under **Event**, select **Push to a branch**.
5. Under **Source**, connect your GitHub Repository and select the `main` branch.
6. Under **Configuration**, select **Cloud Build configuration file (yaml)** and verify the path points to `cloudbuild.yaml`.
7. Under **Substitutions**, add any custom variable values if needed.
8. Click **Create**. Every commit merged to the `main` branch will automatically build, tag, and update the Cloud Run service.

---

## 5. Health Monitoring & Verification

Once deployed, verify container health by checking the console or executing tests:

* **Root Status check**:
  ```bash
  curl https://civiq-service-xxxx-as.a.run.app/api/health
  ```
  **Expected response body**:
  ```json
  {
    "status": "healthy",
    "uptime": 24.12,
    "version": "1.0.0-rc2",
    "environment": "production",
    "timestamp": "2026-06-29T10:16:48.000Z"
  }
  ```
* **Mapbox and Maps integration**: Access `/map` route, confirming coordinates resolve and radar pulses do not crash the view when network offline checks occur.

---

## 6. Disaster Recovery & Rollback Procedure

If a deployed build triggers errors or regression:

### Method A: Cloud Run Console (Recommended)
1. Go to **Google Cloud Console > Cloud Run**.
2. Select your `civiq-service` service.
3. Click the **Revisions** tab.
4. Select the checkmark next to the previously working Revision.
5. Click **Manage Traffic** at the top, assign **100%** traffic to that revision, and click **Save**. The service instantly rolls back with zero downtime.

### Method B: gcloud CLI
Run this command to force deployment of a previously built Artifact Registry image tag:
```bash
gcloud run deploy civiq-service \
    --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/civiq-repo/civiq-app:PREVIOUS_WORKING_SHA \
    --region asia-south1
```
