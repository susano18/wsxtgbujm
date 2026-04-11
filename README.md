# 🎯 Smart Attendance System

A production-grade face recognition attendance system built with **Python**, **Flask**, **OpenCV**, and the **face_recognition** library. Features a RESTful API, real-time camera feed, multi-format exports, analytics, and admin authentication.

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Face Recognition** | Register students with photos, auto-detect and mark attendance via face matching |
| **Multi-Encoding Support** | Store multiple face encodings per student for higher accuracy |
| **Confidence Scoring** | Each attendance entry includes a recognition confidence score (0–1) |
| **Duplicate Prevention** | Automatic same-day duplicate check via DB constraint |
| **RESTful API** | Full CRUD for students, attendance, users, and analytics |
| **Multi-Camera Support** | Manage multiple camera feeds simultaneously |
| **Export Reports** | Download attendance in **CSV**, **Excel (.xlsx)**, and **PDF** |
| **Analytics Dashboard** | Daily stats, per-student stats, top attendees, attendance trends |
| **JWT Authentication** | Secure token-based auth with admin/viewer roles |
| **Email Notifications** | Optional attendance confirmation emails via SMTP |
| **Logging** | Rotating file logs with structured format |

---

## 🏗 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Client /   │────▶│  Flask API   │────▶│  SQLite Database │
│   Frontend   │◀────│  (Routes)    │◀────│                  │
└─────────────┘     └──────┬───────┘     └──────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        Controllers    Services     Utilities
        (Business      (Face +      (Auth, Email,
         Logic)        Camera)       Validation)
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Python 3.9+**
- **CMake** and **dlib** (required by `face_recognition`)
  - Windows: `pip install cmake dlib` (or download prebuilt wheel)
  - Linux: `sudo apt-get install cmake libdlib-dev`
  - macOS: `brew install cmake dlib`

### Installation Steps

```bash
# 1. Clone / navigate to the project
cd wsxtgbujm

# 2. Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment config
copy .env.example .env    # Windows
cp .env.example .env      # Linux/macOS

# 5. Edit .env with your settings (especially SECRET_KEY and JWT_SECRET_KEY)

# 6. Run the server
python main.py
```

The server starts at **http://localhost:5000**. A default admin user is created automatically:
- **Username:** `admin`
- **Password:** `admin123`

---

## ⚙ Configuration

All settings are managed via the `.env` file:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `dev-secret...` | Flask secret key |
| `JWT_SECRET_KEY` | `jwt-dev...` | JWT signing key |
| `DATABASE_URL` | `sqlite:///attendance_system.db` | Database connection string |
| `FACE_RECOGNITION_TOLERANCE` | `0.5` | Match threshold (lower = stricter) |
| `FACE_RECOGNITION_MODEL` | `hog` | `hog` (fast/CPU) or `cnn` (accurate/GPU) |
| `MAIL_SERVER` | `smtp.gmail.com` | SMTP server for email |
| `ADMIN_USERNAME` | `admin` | Default admin username |

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | None | Login, returns JWT token |
| `GET` | `/api/auth/me` | Token | Get current user profile |
| `POST` | `/api/auth/change-password` | Token | Change password |
| `POST` | `/api/auth/register` | Admin | Create new user |

#### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Students

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/students` | Token | List students (paginated, searchable) |
| `GET` | `/api/students/:id` | Token | Get single student |
| `POST` | `/api/students` | Admin | Register new student (multipart with photo) |
| `PUT` | `/api/students/:id` | Admin | Update student info |
| `DELETE` | `/api/students/:id` | Admin | Delete student |
| `POST` | `/api/students/:id/encodings` | Admin | Add face encoding |

#### Register Student Example
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "student_id=STU001" \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "department=Computer Science" \
  -F "year=3" \
  -F "photo=@path/to/photo.jpg"
```

### Attendance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/attendance/mark` | Token | Mark attendance via image upload |
| `POST` | `/api/attendance/mark/camera` | Token | Mark via connected camera |
| `GET` | `/api/attendance` | Token | Query records (filterable) |
| `GET` | `/api/attendance/student/:id` | Token | Student's attendance history |
| `PUT` | `/api/attendance/:id` | Admin | Update a record |
| `DELETE` | `/api/attendance/:id` | Admin | Delete a record |

#### Mark Attendance Example
```bash
curl -X POST http://localhost:5000/api/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@classroom_photo.jpg" \
  -F "camera_id=cam_0"
```

### Export

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/attendance/export/csv` | Token | Download CSV |
| `GET` | `/api/attendance/export/excel` | Token | Download Excel (.xlsx) |
| `GET` | `/api/attendance/export/pdf` | Token | Download PDF |

All export endpoints accept query params: `date_from`, `date_to`, `student_id`

### Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Token | Overall dashboard summary |
| `GET` | `/api/analytics/daily` | Token | Daily attendance breakdown |
| `GET` | `/api/analytics/student/:id/stats` | Token | Per-student statistics |
| `GET` | `/api/analytics/top-attendees` | Token | Leaderboard by attendance |
| `GET` | `/api/analytics/cameras` | Token | Connected camera status |

---

## 📁 Project Structure

```
wsxtgbujm/
├── app/
│   ├── __init__.py              # App factory (Flask setup, blueprints)
│   ├── config.py                # Environment-based configuration
│   ├── models/
│   │   ├── database.py          # SQLAlchemy instance
│   │   ├── student.py           # Student model + face encodings
│   │   ├── attendance.py        # Attendance record model
│   │   └── user.py              # Admin user model (bcrypt auth)
│   ├── routes/
│   │   ├── auth.py              # Login, register, password change
│   │   ├── students.py          # Student CRUD endpoints
│   │   ├── attendance.py        # Mark + query + export endpoints
│   │   └── analytics.py         # Dashboard, stats, leaderboards
│   ├── controllers/
│   │   ├── student_controller.py    # Student business logic
│   │   ├── attendance_controller.py # Attendance marking + queries
│   │   └── export_controller.py     # CSV/Excel/PDF generation
│   ├── services/
│   │   ├── face_service.py      # Face detect/encode/compare
│   │   └── camera_service.py    # Multi-camera management
│   └── utils/
│       ├── auth.py              # JWT helpers & decorators
│       ├── validators.py        # Input validation
│       ├── email_service.py     # SMTP notifications
│       └── logger.py            # Rotating file logger
├── static/photos/               # Student photos (auto-created)
├── exports/                     # Generated reports (auto-created)
├── logs/                        # Application logs (auto-created)
├── main.py                      # Entry point
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
└── README.md                    # This file
```

---

## 📄 License

MIT — feel free to use and modify.
