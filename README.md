# Google Calendar Events Viewer

A modern web application built with SvelteKit and Firebase that allows users to view and manage their Google Calendar events after signing in with their Google account.

## Features

- **Authentication**
  - Google SSO Authentication
  - Secure token management
  - Persistent login state

- **Event Management**
  - View Google Calendar Events in a clean, organized table
  - Real-time event updates
  - Detailed event information including title, time, location, and type
  - Responsive design for all screen sizes

- **Smart Filtering**
  - Automatic date-based filtering
  - Search across event titles, descriptions, and locations
  - Filter by event type (Default, Gmail, Birthday, Working Location)
  - Quick "Today" filter for current day's events

- **Export Capabilities**
  - Export events to CSV format
  - Generate PDF reports with event details
  - Customized formatting for exported data

- **Modern UI/UX**
  - Dark mode interface
  - Responsive design with Tailwind CSS
  - Loading states and animations
  - Clean and intuitive layout
  - Mobile-optimized views

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project and enable Google Authentication:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication and add Google as a sign-in provider
   - Create a web app in your Firebase project
   - Copy the Firebase configuration

4. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Technologies Used

- SvelteKit - Frontend framework
- Firebase Authentication - User authentication
- Google Calendar API - Calendar data management
- Tailwind CSS - Styling and responsive design
- TypeScript - Type safety and better developer experience
- date-fns - Date formatting and manipulation

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── Calendar.svelte    # Main calendar component
│   ├── firebase.ts            # Firebase configuration
│   ├── calendar.ts            # Calendar API functions
│   └── stores/
│       └── auth.ts            # Authentication store
├── routes/
│   ├── +layout.svelte         # Main layout with auth state
│   └── +page.svelte          # Home page with login and features
├── app.html                   # Base HTML template
└── app.css                    # Global styles and Tailwind imports
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


