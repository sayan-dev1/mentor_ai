# 🚀 AWS EC2 + Docker Deployment Guide for MentorAI

This guide provides step-by-step instructions for deploying **MentorAI** on a free-tier **AWS EC2** instance using **Docker** and **Docker Compose**.

---

## 📌 Deployment Architecture

```
GitHub Repository 
      │
      ▼ (git clone)
AWS EC2 Instance (Ubuntu 24.04 LTS / t2.micro)
      │
      ▼ (docker-compose up --build -d)
[ Docker Container Stack ]
  ├── frontend (React WebApp served via Nginx Port 80 with SSE proxy)
  └── backend  (FastAPI Engine Port 8000)
```

---

## 🛠️ Step 1: Launch an AWS EC2 Instance (Free Tier)

1. Log in to the **AWS Management Console** and navigate to the **EC2 Dashboard**.
2. Click **Launch Instance**.
3. Configure the following settings:
   - **Name**: `mentorai-server`
   - **Application and OS Image (AMI)**: Select **Ubuntu Server 24.04 LTS** (marked *Free tier eligible*).
   - **Instance Type**: Select **t2.micro** (or `t3.micro` in eligible regions, marked *Free tier eligible*).
   - **Key Pair (login)**: Click **Create new key pair**. Download the `.pem` file (e.g. `mentorai.pem`) and store it securely.
4. **Network Settings**:
   - Check **Allow SSH traffic from** (Select *My IP* or *Anywhere*).
   - Check **Allow HTTP traffic from the internet** (Port 80).
   - Check **Allow HTTPS traffic from the internet** (Port 443).
5. Click **Launch Instance**.

---

## 🔐 Step 2: Configure File Permissions for Key Pair

On your local machine, navigate to the folder where you downloaded `mentorai.pem` and configure the key permissions:

```bash
# On Linux/macOS:
chmod 400 mentorai.pem

# On Windows (PowerShell):
icacls .\mentorai.pem /inheritance:r
icacls .\mentorai.pem /grant:r "${env:USERNAME}:(R)"
```

---

## 🔌 Step 3: Connect to your EC2 Instance via SSH

Locate your EC2 instance's **Public IPv4 address** in the AWS console, then connect:

```bash
ssh -i "mentorai.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## 📦 Step 4: Install Docker & Docker Compose on EC2

Once connected to your EC2 instance, run the following commands to install Docker and Docker Compose:

```bash
# 1. Update package registry
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker
sudo apt-get install -y docker.io

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Add Ubuntu user to the Docker group
sudo usermod -aG docker ubuntu

# 5. Refresh group memberships (or reconnect to SSH)
newgrp docker
```

---

## 🚀 Step 5: Clone Repository and Configure Env

1. Clone your GitHub repository onto the EC2 instance:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Mentor_AI.git
   cd Mentor_AI
   ```

2. Create the backend `.env` file:
   ```bash
   nano backend/.env
   ```
   Add your API Keys:
   ```env
   GROQ_API_KEY="gsk_YOUR_REAL_KEY_HERE"
   OPENROUTER_API_KEY="sk-or-YOUR_REAL_KEY_HERE"
   ```
   *Press `Ctrl+O`, `Enter`, then `Ctrl+X` to save and exit.*

---

## 🚢 Step 6: Deploy with Docker Compose

Build and run your container stack in detached background mode:

```bash
docker-compose up --build -d
```

Verify that the containers are active:
```bash
docker-compose ps
```

---

## 🌐 Step 7: Access the Application

- **Frontend Interface**: Open your browser and navigate to `http://YOUR_EC2_PUBLIC_IP` (Port 80 proxy routing).
- **Backend API Docs**: Navigate to `http://YOUR_EC2_PUBLIC_IP/api/health` to confirm backend connectivity.

---

## 🔒 Optional: Add Free SSL via Let's Encrypt (Certbot)

To secure your deployment with `https://` using a free SSL certificate:

1. Map your domain name (e.g. `mentorai.example.com`) to your EC2 public IP using an **A Record** in your DNS registrar (GoDaddy, Namecheap, Route 53).
2. Install Certbot on the EC2 instance:
   ```bash
   sudo apt-get install -y certbot
   ```
3. Generate the certificate:
   ```bash
   sudo certbot certonly --standalone -d mentorai.example.com
   ```
4. Map the certificates into Nginx by modifying your `frontend/nginx.conf` and updating the `docker-compose.yml` to expose port `443`.
