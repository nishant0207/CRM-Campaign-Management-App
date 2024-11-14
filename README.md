Xeno CRM & Campaign Management App

Xeno CRM & Campaign Management App is a web application that allows brands to manage customer relationships, create audience segments, send personalized campaigns, and track engagement. This app provides a simplified CRM system with key features for customer interaction and data-driven marketing.

Table of Contents

	•	Features
	•	Technologies Used
	•	Setup Instructions
	•	Environment Variables
	•	Usage
	•	Project Structure
	•	Deployment
	•	Future Enhancements

Features

	1.	Customer and Order Data Management: APIs to add customers and orders, including details like spending, visits, and last visit date.
	2.	Audience Segmentation: Create audience segments based on customizable conditions (e.g., spending thresholds, visit frequency).
	3.	Campaign Creation: Define and save campaign details, including personalized messages and target audience conditions.
	4.	Message Sending and Tracking: Send campaign messages to audience segments, with randomized delivery tracking (success/failure).
	5.	Statistics Page: View overall statistics, including total campaigns, messages sent, and failed messages.
	6.	Google Authentication: Secure access to the dashboard with Google sign-in.
	7.	Responsive UI: User-friendly interface for viewing and managing campaigns.

Technologies Used

	•	Frontend: React.js, React Router, Firebase Authentication
	•	Backend: Node.js, Express.js, MongoDB
	•	Database: MongoDB (with Mongoose for data modeling)
	•	Authentication: Firebase Authentication (Google sign-in)
	•	Deployment: Netlify (frontend), Heroku or Render (backend)

Setup Instructions

Prerequisites

	•	Node.js and npm
	•	MongoDB (local or cloud instance)
	•	Firebase project (for Google Authentication)

1. Clone the Repository

git clone https://github.com/your-username/xeno-crm-campaign-app.git
cd xeno-crm-campaign-app

2. Backend Setup

	1.	Navigate to the Backend Directory:

cd xeno-crm


	2.	Install Backend Dependencies:

npm install


	3.	Environment Variables:
Create a .env file in the backend root directory and add the following environment variables:

MONGODB_URI=mongodb://localhost:27017/xeno_crm
PORT=3000


	4.	Run the Backend Server:

node app.js

The backend should now be running on http://localhost:3000.

3. Frontend Setup

	1.	Navigate to the Frontend Directory:

cd xeno-crm-frontend


	2.	Install Frontend Dependencies:

npm install


	3.	Firebase Configuration:
Create a Firebase project in the Firebase Console and enable Google Authentication. Get the Firebase configuration settings and add them to src/firebaseConfig.js:

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();


	4.	Set Up API URL:
In src/services/api.js, set the base URL for the backend API:

const API_URL = 'http://localhost:3000/api';


	5.	Run the Frontend Server:

npm start

The frontend should now be running on http://localhost:3001.

Environment Variables

	•	MONGODB_URI: MongoDB connection string (required for backend)
	•	PORT: Port for backend server
	•	Firebase Config: Add Firebase keys directly in firebaseConfig.js for authentication.

Usage

	1.	Authentication:
	•	Visit http://localhost:3001.
	•	Sign in with your Google account to access the dashboard.
	2.	Dashboard:
	•	Create Campaign: Define a campaign with a target audience based on conditions like spending, visits, and last visit.
	•	Send Messages: Click “Send Messages” for each campaign to send messages to the audience and track delivery.
	•	View Statistics: Navigate to the Statistics page to view cumulative stats for all campaigns.

Project Structure

xeno-crm-campaign-app/
├── xeno-crm/                   # Backend
│   ├── config/                  # MongoDB connection
│   ├── controllers/             # API request handlers
│   ├── models/                  # Mongoose schemas (Customer, Order, Campaign)
│   ├── routes/                  # Route definitions
│   ├── app.js                   # Main server file
│   └── .env                     # Environment variables
└── xeno-crm-frontend/           # Frontend
    ├── public/                  # Public assets
    ├── src/
    │   ├── components/          # Reusable components (e.g., Login)
    │   ├── pages/               # Main pages (Dashboard, Statistics)
    │   ├── services/            # API service functions
    │   ├── App.js               # Main app component
    │   └── firebaseConfig.js    # Firebase config for Google Authentication
    └── .env                     # Frontend environment variables

Deployment

Backend Deployment (Heroku or Render)

	1.	Set Up Environment Variables on the platform for MONGODB_URI and PORT.
	2.	Deploy the backend code to your chosen platform.
	3.	Update the API URL in api.js on the frontend to point to the deployed backend URL.

Frontend Deployment (Netlify or Vercel)

	1.	Build the Frontend:

npm run build


	2.	Deploy to Netlify or Vercel, connecting the repository and specifying the root as xeno-crm-frontend.
	3.	Update Firebase Authorized Domains:
	•	In Firebase Console, add your frontend deployment URL to the list of authorized domains under Authentication settings.

Future Enhancements

	•	Enhanced Campaign Analytics: Track engagement metrics, such as open rates and conversion rates.
	•	Role-Based Access: Different levels of access for admins and marketers.
	•	Advanced Audience Segmentation: More detailed segmentation criteria, such as geographic location or purchase history.
	•	Automated Campaign Scheduling: Schedule campaigns to send automatically at specified times.

License

This project is licensed under the MIT License.

Acknowledgments

	•	Firebase for Authentication and Analytics
	•	MongoDB for data management
	•	React and Node.js for web development
