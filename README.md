# CleanOps Mobile

**Project Code:** SP26SE111 | **Group:** GSP26SE06

Mobile application for **Workers** and **Supervisors** in the project:
**"Integrating AI-Based sanitation evaluation with adaptive process flows to enhance industrial cleaning efficiency."**

---

## Overview

CleanOps Mobile is the field-facing companion app for the CleanOps platform. It empowers cleaning staff to execute assigned tasks, follow AI-guided workflows, and submit inspection results — all from their mobile device in real time.

## Key Features

- **Task Management:** View, accept, and complete assigned cleaning tasks with step-by-step workflow guidance.
- **AI-Assisted Inspections:** Capture and submit photos for AI quality scoring and PPE compliance detection.
- **Real-time Notifications:** Receive instant alerts for new assignments, urgent incidents, and SLA warnings.
- **Attendance & Check-in:** QR-based location check-in to verify on-site presence at job sites.
- **Incident Reporting:** Submit ad-hoc issue reports with photos and notes directly from the field.
- **Supervisor Dashboard:** Supervisors can monitor team progress, review AI flags, and approve task completions on the go.

---

## Tech Stack

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Navigation:** Expo Router (file-based routing)
- **Styling:** React Native StyleSheet
- **State Management:** React Context API + Custom Hooks
- **Real-time Communication:** Socket.io-client (urgent incident notifications)
- **API Client:** Axios communicating with .NET Backend Modular Monolith
- **Authentication:** Auth0 (OAuth2 / JWT)

---

## Project Structure

```text
cleanops-mobile/
├── app/                  # Routes and screens (Expo Router file-based)
│   ├── (tabs)/           # Bottom tab navigator screens
│   ├── _layout.tsx       # Root layout
│   └── modal.tsx         # Modal screens
├── screens/              # UI components for each screen
├── components/           # Shared reusable UI components (Button, Card...)
├── services/             # Backend API modules (.NET API integration)
├── hooks/                # Custom React Hooks (useFetch, useAuth...)
├── utils/                # Utility functions (formatDate, formatStatus...)
├── config/               # API URLs, environment constants
├── types/                # TypeScript interfaces and types
├── assets/               # Images, fonts, icons
└── constants/            # App-wide constants
```

---

## Getting Started

### 1. Prerequisites

- Node.js (v18.x or higher)
- npm / Yarn
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <YOUR_GIT_REPO_URL>
cd cleanops-mobile
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root (use `.env.example` as a template):

```env
# Backend API Gateway URL
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# Auth0 Configuration
EXPO_PUBLIC_AUTH0_DOMAIN=<YOUR_AUTH0_DOMAIN>
EXPO_PUBLIC_AUTH0_CLIENT_ID=<YOUR_AUTH0_CLIENT_ID>

# Socket.io URL for real-time notifications
EXPO_PUBLIC_SOCKET_URL=http://localhost:5001
```

> ⚠️ Never commit `.env` to Git. Ask your team lead for the correct values.

### 4. Run the Application

```bash
npx expo start
```

Then:

- **iOS:** Open Camera → scan the QR code
- **Android:** Open Expo Go → scan the QR code
- **Simulator:** Press `i` (iOS) or `a` (Android) in the terminal

> 📱 Make sure your phone and computer are on the **same Wi-Fi network**.

---

## Development Guidelines

- **API Services:** All backend requests must be defined in `services/` — do not call Axios directly inside UI components or screens.
- **Authentication:** Every protected screen must use the `useAuth()` hook to retrieve the JWT token.
- **Styling:** Keep styles in a separate `ScreenName.styles.ts` file alongside each screen.
- **Commit Convention:** Use `<type>: <short description>`.
  Example: `feat: add task check-in screen`, `fix: fix keyboard overlap on login`.

---

## Contributors

- Nguyen Duy Anh - Leader
- Huynh Ngoc Khanh - Member
- Nguyen Nam Phong - Member
- Dang Nguyen Hai Nam - Member
- Vo Minh Luan - Member

**Supervisor:** Nguyen Nguyen Binh
