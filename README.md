# DSA Tracking Platform

A comprehensive platform for tracking company-wise DSA (Data Structures & Algorithms) interview questions. Browse questions without login, track your progress after signing up.

## Features

### Guest Users (No Login Required)
- Browse all DSA questions
- Filter by company, difficulty, topics, and time range
- Search by question title
- View question statistics

### Registered Users (Free to Sign Up)
- Track your personal progress
- Mark questions as: Solved, Unsolved, or Revisiting
- Add personal notes to questions
- View detailed progress dashboard
- See progress by difficulty and company

### Admin Features
- Add and edit questions
- Bulk upload via CSV
- Manage company-question relationships

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
dsa-tracking-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── ui/         # shadcn/ui style components
│   │   │   ├── Navbar.jsx
│   │   │   └── QuestionCard.jsx
│   │   ├── contexts/       # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                  # Express backend
│   ├── models/             # Mongoose models
│   │   ├── User.js
│   │   ├── Question.js
│   │   └── Tracking.js
│   ├── routes/             # Express routes
│   │   ├── auth.js
│   │   ├── questions.js
│   │   ├── tracking.js
│   │   └── admin.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js
│   ├── seeders/            # Database seeders
│   │   └── seed.js
│   ├── server.js
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dsa-tracking-platform
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
```bash
# Copy the example env file
cp server/.env.example server/.env

# Edit server/.env with your configuration
```

4. Seed the database with sample questions:
```bash
npm run seed
```

5. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server at http://localhost:5000
- Frontend dev server at http://localhost:5173

## Environment Variables

### Server (.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017dsa-tracking
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions` - Get all questions (with filters)
- `GET /api/questions/:id` - Get single question
- `GET /api/questions/companies` - Get all companies
- `GET /api/questions/topics` - Get all topics
- `GET /api/questions/stats` - Get question statistics

### Tracking
- `GET /api/tracking` - Get user's tracking records
- `GET /api/tracking/stats` - Get user's progress stats
- `POST /api/tracking/:questionId` - Create/update tracking
- `PUT /api/tracking/:questionId` - Update tracking status
- `DELETE /api/tracking/:questionId` - Delete tracking record

### Admin
- `POST /api/admin/upload` - Upload CSV file
- `POST /api/admin/questions` - Bulk create questions
- `GET /api/admin/stats` - Get admin statistics

## CSV Upload Format

Required columns:
- Title
- Difficulty (Easy, Medium, Hard)
- Topics (comma-separated)
- Link
- Acceptance Rate
- Company

Optional columns:
- Last Asked Date (YYYY-MM-DD)
- Asked Within (30days, 2months, 6months, older)
- Frequency

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
