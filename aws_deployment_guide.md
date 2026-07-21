# 🚀 AWS ECS Fargate + ECR Deployment Guide (Express Mode)

This guide provides step-by-step instructions for deploying **MentorAI** to **Amazon ECS (Elastic Container Service) on AWS Fargate** using **Amazon ECR (Elastic Container Registry)**. This setup uses **AWS Copilot**, AWS's officially recommended tool for serverless container deployment.

---

## 📌 Deployment Architecture

```
GitHub Repository 
      │
      ▼
Docker Build (Local or CI)
      │
      ▼
Amazon ECR (Elastic Container Registry)
      │
      ▼
Amazon ECS (Task Definition on AWS Fargate)
      │
      ▼
Application Load Balancer (ALB) ──► HTTPS URL (Managed Service)
```

---

## 🛠️ Step 1: Install AWS CLI & AWS Copilot

AWS Copilot is the officially supported tool for managing ECS applications in "Express Mode".

1. **Install AWS CLI**: Follow the installation guide for [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. **Configure AWS Credentials**:
   ```bash
   aws configure
   ```
   *Enter your AWS Access Key ID, Secret Access Key, Default region (e.g. `us-east-1`), and Output format (`json`).*
3. **Install AWS Copilot CLI**:
   - **macOS (Homebrew)**: `brew install aws/tap/copilot-cli`
   - **Windows (PowerShell)**:
     ```powershell
     New-Item -Directory -Path "$Env:ProgramFiles\Amazon\Copilot" -Force
     Invoke-WebRequest -OutFile "$Env:ProgramFiles\Amazon\Copilot\copilot.exe" https://github.com/aws/copilot-cli/releases/latest/download/copilot-windows.exe
     [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$Env:ProgramFiles\Amazon\Copilot", "Machine")
     ```
   - **Linux**:
     ```bash
     curl -Lo copilot https://github.com/aws/copilot-cli/releases/latest/download/copilot-linux && chmod +x copilot && sudo mv copilot /usr/local/bin/copilot
     ```

---

## 📦 Step 2: Initialize the ECS Application

Navigate to the root directory of your `Mentor_AI` project and initialize the application structure:

```bash
# Initialize Copilot application
copilot app init mentorai
```

This creates an isolated infrastructure group (VPC, Subnets, Internet Gateways) for your services.

---

## 🚀 Step 3: Deploy the Backend Service

1. Create a Load Balanced Web Service for the backend FastAPI container:
   ```bash
   copilot svc init --name backend --svc-type "Load Balanced Web Service" --dockerfile ./backend/Dockerfile
   ```

2. This command automatically:
   - Configures a private Amazon ECR repository for the backend.
   - Generates task definitions mapping port `8000`.
   - Creates a manifest configuration file at `copilot/backend/manifest.yml`.

3. **Configure Environment Variables**:
   Open `copilot/backend/manifest.yml` and add your API Keys under the `variables` section:
   ```yaml
   variables:
     PORT: 8000
   secrets:
     GROQ_API_KEY: /copilot/mentorai/secrets/GROQ_API_KEY
     OPENROUTER_API_KEY: /copilot/mentorai/secrets/OPENROUTER_API_KEY
   ```

4. **Register the Secrets in AWS Systems Manager Parameter Store**:
   ```bash
   copilot secret init --name GROQ_API_KEY
   # Enter your Groq API Key when prompted

   copilot secret init --name OPENROUTER_API_KEY
   # Enter your OpenRouter API Key when prompted
   ```

---

## 🚢 Step 4: Deploy the Frontend Web App

1. Initialize the frontend service:
   ```bash
   copilot svc init --name frontend --svc-type "Load Balanced Web Service" --dockerfile ./frontend/Dockerfile
   ```

2. This configures another private ECR repository and creates `copilot/frontend/manifest.yml`.
3. Open `copilot/frontend/manifest.yml` and ensure the ingress path routes default traffic:
   ```yaml
   http:
     path: '/'
     healthcheck: '/'
   ```

---

## 🌐 Step 5: Provision the Environment (Launch to ECS)

Deploy both services to the Fargate environment (VPC, ECS Cluster, and Application Load Balancer):

```bash
# 1. Create a development environment (VPC, Subnets, ALB)
copilot env init --name test --profile default --default-config

# 2. Deploy the backend service
copilot svc deploy --name backend --env test

# 3. Deploy the frontend service
copilot svc deploy --name frontend --env test
```

Copilot will automatically:
1. Build both Docker images locally.
2. Push them to Amazon ECR.
3. Provision serverless Amazon ECS Fargate tasks.
4. Set up an Application Load Balancer (ALB) routing all `/api/` traffic to the backend, and remaining traffic to the React frontend.
5. Provide a secure public HTTPS URL for your application!

---

## 🧹 Step 6: Teardown (Avoid Charges)

To stop services and delete all provisioned AWS resources (VPC, ALB, ECS, ECR repos):

```bash
copilot app delete --name mentorai
```
