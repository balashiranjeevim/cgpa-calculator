# CGPA Master - Full-Stack CGPA Calculator Web Application

A modern, responsive, production-ready Full-Stack CGPA Calculator Web Application built with **Angular (TypeScript)**, **Node.js with Express.js (TypeScript)**, and **MySQL** with `mysql2`.

---

## 1. System Architecture & Tech Stack

```
+-------------------------------------------------------------+
|                Angular Frontend (TypeScript)                |
|  - Standalone Components & Modern Router                    |
|  - Reactive Forms (FormArray dynamic subjects)             |
|  - Real-time SGPA & Quality Points Calculation             |
|  - Responsive Modern CSS Design System                      |
+------------------------------+------------------------------+
                               | REST APIs (HTTP / JSON)
                               v
+-------------------------------------------------------------+
|                Express.js Backend (TypeScript)              |
|  - Modular Layering: Routes -> Controllers -> Services      |
|  - Zod Request Validation & Parameterized SQL               |
|  - Database ACID Transactions (Commit / Rollback)           |
|  - Dynamic CGPA Recalculation Engine                        |
+------------------------------+------------------------------+
                               | mysql2 / Connection Pool
                               v
+-------------------------------------------------------------+
|                     MySQL Database                          |
|  - semesters (1:N) subjects (Foreign Key CASCADE)           |
|  - Indexes on semester_number, semester_id                  |
+-------------------------------------------------------------+
```

### Core Technologies
- **Frontend:** Angular 22 (TypeScript), Reactive Forms, Router, HttpClient
- **Backend:** Node.js, Express.js, TypeScript, Zod, CORS, dotenv
- **Database:** MySQL 8+ with `mysql2/promise` connection pooling
- **Design:** Custom modern responsive CSS design system with CSS custom properties, utility classes, and glassmorphism accents

---

## 2. Mathematical Calculation Formulas

### Semester Grade Point Average (SGPA)
$$\text{SGPA} = \frac{\sum (\text{Subject Credit} \times \text{Grade Point})}{\sum \text{Subject Credits}}$$

- Evaluated to 2 decimal places precision.
- Safeguarded against division by zero (defaults to `0.00` if total credits = 0).

### Cumulative Grade Point Average (CGPA)
$$\text{CGPA} = \frac{\sum (\text{Semester Total Credits} \times \text{Semester SGPA})}{\sum \text{Semester Total Credits}}$$

- Calculated dynamically from all stored semester records in MySQL on every fetch, ensuring the CGPA is never stale.

### Standard Grading Scale Reference

| Letter Grade | Grade Point | Percentage Range | Classification |
|---|---|---|---|
| **O** (Outstanding) | 10.0 | 90% – 100% | First Class with Distinction |
| **A+** (Excellent) | 9.0 | 80% – 89% | First Class with Distinction |
| **A** (Very Good) | 8.0 | 70% – 79% | First Class |
| **B+** (Good) | 7.0 | 60% – 69% | First Class |
| **B** (Above Average) | 6.0 | 55% – 59% | Second Class |
| **C** (Average) | 5.0 | 50% – 54% | Second Class |
| **P** (Pass) | 4.0 | 40% – 49% | Pass Class |
| **F** (Fail) | 0.0 | Below 40% | Reappear |

---

## 3. Database Schema

The normalized relational database consists of two tables linked via a 1:N foreign key with `ON DELETE CASCADE`.

```sql
CREATE DATABASE IF NOT EXISTS `cgpa_calculator_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cgpa_calculator_db`;

-- 1. Semesters Table
CREATE TABLE IF NOT EXISTS `semesters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `semester_number` INT NOT NULL,
  `semester_heading` VARCHAR(150) NOT NULL,
  `sgpa` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
  `total_credits` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_semester_number` (`semester_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `semester_id` INT NOT NULL,
  `subject_name` VARCHAR(150) NOT NULL,
  `subject_code` VARCHAR(50) DEFAULT NULL,
  `credits` DECIMAL(4, 2) NOT NULL,
  `grade_point` DECIMAL(4, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_semester_id` (`semester_id`),
  CONSTRAINT `fk_subjects_semester`
    FOREIGN KEY (`semester_id`)
    REFERENCES `semesters` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. REST API Endpoints

All endpoints respond with standardized JSON envelopes (`{ success: true/false, data, message, errors }`).

| Method | Endpoint | Description | Payload / Notes |
|---|---|---|---|
| `GET` | `/api/health` | Service health status | Returns status, service name, timestamp |
| `GET` | `/api/cgpa` | Dynamically calculated overall CGPA | Returns overall CGPA, completed credits, and semester breakdown |
| `GET` | `/api/semesters` | Retrieve all saved semesters | Returns list of semesters sorted by semester number |
| `GET` | `/api/semesters/:id` | Retrieve semester details by ID | Returns semester with all nested subjects |
| `POST` | `/api/semesters` | Create semester and subjects | Runs within MySQL ACID transaction |
| `PUT` | `/api/semesters/:id` | Update existing semester and subjects | Atomic replace within MySQL ACID transaction |
| `DELETE`| `/api/semesters/:id` | Delete semester | Cascades deletion of associated subjects |

### Sample POST/PUT Request Body
```json
{
  "semester_number": 1,
  "semester_heading": "Semester 1 - Fall 2024",
  "subjects": [
    { "subject_name": "Engineering Mathematics I", "subject_code": "MAT101", "credits": 4, "grade_point": 9.0 },
    { "subject_name": "Physics for Engineers", "subject_code": "PHY101", "credits": 4, "grade_point": 8.0 },
    { "subject_name": "Programming in C", "subject_code": "CSE101", "credits": 3, "grade_point": 10.0 },
    { "subject_name": "Engineering Physics Lab", "subject_code": "PHY102", "credits": 1.5, "grade_point": 9.0 }
  ]
}
```

---

## 5. Frontend Pages & Modules

1. **Dashboard (`/dashboard`)**
   - High-impact stat cards: Cumulative CGPA, Completed Credits, Total Semesters.
   - Interactive Academic Scale progress indicator.
   - Semester performance breakdown table with inline actions (View, Edit, Delete).
   - Dynamic academic standing calculation (Distinction, First Class, etc.).

2. **CGPA Calculator (`/calculator`)**
   - Dynamic Reactive Form (`FormArray`) supporting adding and removing unlimited courses.
   - Live instantaneous SGPA recalculation as the user types without lag.
   - Standard letter grade preset selector with automatic grade point assignment and manual override.
   - Supports both creation of new semesters and editing existing records (`/calculator?edit=:id`).
   - Built-in sample academic template loader for quick testing.

3. **Semester History (`/history`)**
   - Complete historical log of saved semesters from MySQL.
   - Real-time search by heading or semester number.
   - Multi-mode sorting (Semester ascending/descending, SGPA high/low, credits).
   - Delete confirmation modal with automatic CGPA recalculation.

4. **Semester Details (`/semester/:id`)**
   - Breadcrumb navigation.
   - Full tabular breakdown of each course: credits, grade points, letter grade, and quality points ($C \times G$).
   - Quick action buttons to edit or delete.

5. **Shared Components & Services**
   - **Navbar:** Sticky navigation with active route indication and mobile responsive drawer.
   - **StatCard:** Reusable metrics card with customizable themes and icons.
   - **Toast Notifications:** Reactive notification service for success, error, and info alerts.
   - **ConfirmModal:** Accessible modal dialog for safe deletion operations.

---

## 6. Directory Structure

```
cgpa-calculator/
├── package.json                   # Root orchestration scripts
├── README.md                      # Comprehensive documentation
├── .env                           # Environment configuration
├── backend/                       # Express.js TypeScript Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts               # Server entry point
│       ├── app.ts                 # Express app setup & middlewares
│       ├── config/
│       │   ├── db.ts              # mysql2 connection pool
│       │   ├── schema.sql         # SQL schema definitions
│       │   └── migrate.ts         # Standalone database migration runner
│       ├── controllers/
│       │   ├── semesterController.ts
│       │   └── cgpaController.ts
│       ├── services/
│       │   ├── semesterService.ts # Transactional DB operations
│       │   └── cgpaService.ts     # Dynamic CGPA computation
│       ├── middlewares/
│       │   ├── validateRequest.ts # Zod schema validators
│       │   └── errorHandler.ts    # Centralized error handler
│       ├── models/
│       │   └── types.ts           # TypeScript interfaces
│       └── utils/
│           └── calculator.ts      # SGPA & CGPA math calculations
└── frontend/                      # Angular 22 Frontend
    ├── package.json
    ├── angular.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.html
    │   ├── styles.css             # Modern design system & utilities
    │   ├── environments/
    │   │   └── environment.ts     # API endpoint configuration
    │   └── app/
    │       ├── app.ts             # Root application component
    │       ├── app.html
    │       ├── app.css
    │       ├── app.routes.ts      # Angular Router definitions
    │       ├── app.config.ts      # Providers & HttpClient
    │       ├── models/
    │       │   └── semester.model.ts
    │       ├── services/
    │       │   ├── semester.service.ts
    │       │   ├── cgpa.service.ts
    │       │   └── notification.service.ts
    │       ├── components/
    │       │   ├── navbar/
    │       │   ├── stat-card/
    │       │   ├── toast/
    │       │   └── confirm-modal/
    │       └── pages/
    │           ├── dashboard/
    │           ├── calculator/
    │           ├── history/
    │           └── semester-detail/
```

---

## 7. Installation & Quickstart

### Prerequisites
- Node.js (v18+)
- MySQL Server (v8.0+)
- npm (v9+)

### Step 1: Clone Repository and Install Dependencies
```bash
# Clone the repository
git clone <repo-url> cgpa-calculator
cd cgpa-calculator

# Install dependencies for both backend and frontend
npm run install:all
```

### Step 2: Configure Environment Variables
Copy `.env.example` in `backend/` (or use the root `.env`):
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your MySQL connection credentials:
```env
PORT=5000
NODE_ENV=development

# MySQL Credentials
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cgpa_calculator_db

# Optional Unix Socket Path (if connecting via socket)
# DB_SOCKET_PATH=/var/run/mysqld/mysqld.sock
```

### Step 3: Run Database Migrations
Run the automated schema migration to ensure tables exist in MySQL:
```bash
npm run migrate
```

### Step 4: Start the Backend Server
```bash
# In development mode with ts-node
npm run dev:backend

# Or build and run production bundle
npm run build:backend
npm run start:backend
```
The backend API starts on `http://localhost:5000`.

### Step 5: Start the Angular Frontend
In a separate terminal window:
```bash
npm run dev:frontend
```
Open your browser and navigate to `http://localhost:4200`.

---

## 8. Verification & Test Summary

All backend operations were verified against live MySQL:
- **SGPA Calculation:** Precision tested with credit-weighted sums: $\text{SGPA} = \frac{\sum (C \times G)}{\sum C}$
- **Dynamic CGPA Recalculation:** Accurately recalculates upon every semester creation, update, or deletion.
- **ACID Transactions:** Full rollback tested on database errors during batch subject inserts.
- **Input Validations:** Enforced through Zod schemas for course names, numeric credits ($>0$), and valid grade points ($0-10$).
- **Frontend Build:** Angular application bundle compiled and verified without build warnings or missing dependencies.
