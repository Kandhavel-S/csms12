# Curriculum Syllabus Management System (CSMS)

A comprehensive web application for managing academic curriculum and syllabus documents across different departments and user roles.

## Features

- **Multi-role Authentication**: Support for Superuser, HOD (Head of Department), Faculty, and Subject Expert roles
- **Curriculum Management**: Create, upload, and manage curriculum documents
- **Syllabus Management**: Generate and manage syllabus documents with advanced editing capabilities
- **Department Management**: Organize content by academic departments
- **Document Processing**: Support for DOCX, PDF, and other document formats
- **Real-time Collaboration**: Socket.io integration for real-time updates
- **Responsive UI**: Modern interface built with Next.js, Tailwind CSS, and Radix UI components

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js/Express** - Primary API server
- **Python/Flask** - Document processing and additional services
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication
- **Multer** - File upload handling
- **GridFS** - Large file storage

### Document Processing
- **DocxTemplater** - DOCX template processing
- **Mammoth** - DOCX to HTML conversion
- **PDF-parse** - PDF text extraction
- **Docx-merger** - Document merging utilities

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- MongoDB
- pnpm (recommended) or npm

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd csms12
   ```

2. **Install frontend dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   npm install
   cd ..
   ```

4. **Environment Setup**
   Create `.env.local` in the root directory with:
   ```
   MONGODB_URI=mongodb://localhost:27017/csms
   JWT_SECRET=your-secret-key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

   Create `.env` in the backend directory with:
   ```
   MONGODB_URI=mongodb://localhost:27017/csms
   JWT_SECRET=your-secret-key
   PORT=3001
   ```

## Running the Application

### Development Mode

1. **Start MongoDB**
   Make sure MongoDB is running on your system.

2. **Start the backend servers**
   ```bash
   # Terminal 1: Start Node.js backend
   cd backend
   npm run dev

   # Terminal 2: Start Python backend
   python app.py
   ```

3. **Start the frontend**
   ```bash
   # Terminal 3: Start Next.js development server
   npm run dev
   ```

4. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   npm start
   ```

2. **Deploy backend**
   The backend is configured for deployment on platforms like Heroku with the provided Procfile.

## Project Structure

```
csms12/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   └── globals.css       # Global styles
├── backend/               # Backend services
│   ├── controllers/      # API controllers
│   ├── middleware/       # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── uploads/         # File uploads directory
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── dashboard-layout.tsx
│   └── *-dashboard.tsx  # Role-specific dashboards
├── lib/                 # Utility libraries
├── public/              # Static assets
└── utils/               # Client-side utilities
```

## User Roles & Permissions

### Superuser
- Full system access
- Manage departments and users
- View all curriculum and syllabus data
- System administration

### HOD (Head of Department)
- Manage department-specific curriculum
- Approve faculty submissions
- View department reports

### Faculty
- Create and edit syllabus documents
- Submit curriculum for approval
- Access department resources

### Subject Expert
- Review and validate syllabus content
- Provide expert feedback
- Quality assurance

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset

### Curriculum Management
- `GET /api/curriculum` - Get curriculum data
- `POST /api/curriculum` - Create new curriculum
- `PUT /api/curriculum/:id` - Update curriculum

### Syllabus Management
- `GET /api/syllabus` - Get syllabus data
- `POST /api/syllabus` - Create new syllabus

### Department Management
- `GET /api/departments` - Get departments
- `POST /api/departments` - Create department

## Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Backend
npm run dev          # Start development server (nodemon)
npm start            # Start production server
```

### Code Quality

- Uses ESLint for JavaScript/TypeScript linting
- TypeScript for type safety
- Follows Next.js best practices

## Deployment

The application is configured for deployment on:

- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Heroku, Railway, or VPS with the provided Procfile

### Environment Variables

Ensure the following environment variables are set in production:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `PORT` - Backend server port

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.