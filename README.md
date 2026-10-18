# StudyShelf — Study Resource Sharing Platform

StudyShelf is a beginner-friendly MERN stack proof of concept. Students can share links to study notes, videos, websites, and other learning resources, then search, filter, edit, or delete them.

## Features

- Add, view, edit, and delete study resources
- Search resources by title, subject, description, or contributor
- Filter resources by type
- Validate required fields and links
- Store resource details in MongoDB Atlas
- Display helpful errors if the API or database is unavailable

## Requirements

- Node.js 20 or newer
- An internet connection
- A free MongoDB Atlas account and database

You do **not** need to download MongoDB Community Server or MongoDB Compass. Atlas hosts the database online.

## 1. Set up MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. In Atlas, create a database user and save its username and password.
3. Add your current IP address under **Network Access**.
4. Choose **Connect** → **Drivers** and copy the connection string.
5. Replace `<username>`, `<password>`, and `<cluster-url>` in the string with your Atlas details. URL-encode special characters in the password if needed.

## 2. Configure the application

Open a terminal in the project folder and install dependencies:

```bash
npm install
```

Copy `server/.env.example` to `server/.env`, then put your Atlas connection string in `server/.env`:

```env
MONGODB_URI=mongodb+srv://your-user:your-password@your-cluster.mongodb.net/study_resource_hub?retryWrites=true&w=majority
PORT=5000
```

Do not share or commit `server/.env`; it contains your database credentials.

## 3. Run the application

From the project folder, run:

```bash
npm run dev
```

Open the Vite URL printed in the terminal (usually `http://localhost:5173`). Keep the terminal open while using the app. It runs the React website and Express API together.

If Atlas is not configured or cannot be reached, the website still opens and displays a clear database connection message. Add or correct `server/.env`, then restart the app.

To create a production build of the React website, run `npm run build`. To run only the API, use `npm run start`.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check that the API is running |
| GET | `/api/resources` | List resources |
| POST | `/api/resources` | Add a resource |
| PUT | `/api/resources/:id` | Update a resource |
| DELETE | `/api/resources/:id` | Delete a resource |

## Project layout

```text
client/                 React interface and Vite configuration
  src/App.jsx           Page, resource list, search, filters, and form
  src/styles.css        Application styles
server/                 Express API and MongoDB models
  models/Resource.js    Mongoose resource schema
  routes/               Resource API routes
```

This is a proof of concept: it does not include accounts or access control, so anyone who can reach the app can manage the listed resources.
