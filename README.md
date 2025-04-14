# 🏥 Patient Tracker

**Patient Tracker** is a healthcare management software designed to help doctors efficiently monitor and manage their patients' health. The system allows doctors to track health trends, manage medications, and receive alerts for critical health updates. Patients can log their symptoms, adhere to medication schedules, and stay connected with their doctors through a user-friendly interface.



## 📋 Features

### 1. **Authentication System**
- **Signup & Login:** Separate routes for patients and doctors using a role-based authentication system.
- **Security:** Password encryption and role-based access control.

### 2. **Doctor Dashboard**
- **Patient Management:** View, add, or update patient information.
- **Alerts System:** Get to see if patient took medicine or not.
- **Messaging System:** Send messages to patients about medication dosages and alerts.

### 3. **Patient Dashboard**
- **Health Logs:** Patients can log symptoms, medications, and other health data.
- **Medication Reminders:** Receive alerts for medication schedules.

### 5. **Database Schema (PostgreSQL with Prisma)**
- **Models:**
  - `Patient` (patient information, authentication, and health data)
  - `Doctor` (doctor information, specialization, and authentication)
  - `MedicalRecord` (for storing diagnoses and medications)
  - `Prescription` (doctor prescriptions for patients)
  - `PrescribedMedicine` (details of medicines within prescriptions including dosage and timing)
  - `Appointment` (scheduling between doctors and patients)
  - `MedicineAdherence` (tracking medicine intake and reminders)
  - `HealthMetrics` (storing patient health measurements)
  - `Chat` (communication channel between doctor and patient)
  - `Message` (individual messages within a chat)
- **Relationships:** Properly normalized with foreign keys for efficient querying.


## ⚙️ Tech Stack

- **Frontend:** React with Tailwind CSS
- **Backend:** Node.js with Express
- **Database:** PostgreSQL managed through Prisma ORM
- **Authentication:** JWT-based authentication for secure access
- **Styling:** Tailwind CSS for a clean and responsive UI




## 🚀 Installation and Setup

### Prerequisites
- Node.js and npm installed
- PostgreSQL database

### 1. Clone the repository:
```bash
git clone https://github.com/OmkumarMangukiya/patient-tracker.git && cd patient-tracker
```

### 2. Environment Configuration

#### Frontend (.env file in root directory)
Create or update the `.env` file in the root directory with:
```env
DATABASE_URL="postgresql://pt1_owner:npg_8WXuB2AokcYz@ep-square-bread-a1toc31n-pooler.ap-southeast-1.aws.neon.tech/pt1?sslmode=require"
TOKEN_SECRET="mysecret"
EMAIL_USER=omkumarmangukiya706@gmail.com
EMAIL_PASS="your password"
JWT_SECRET=your-jwt-secret
VITE_BACKEND_URL=http://localhost:8000
```

#### Backend (.env file in backend directory)
Create or update the `.env` file in the backend directory with:
```env
DATABASE_URL="postgresql://pt1_owner:npg_8WXuB2AokcYz@ep-square-bread-a1toc31n-pooler.ap-southeast-1.aws.neon.tech/pt1?sslmode=require"
TOKEN_SECRET="mysecret"
EMAIL_USER=omkumarmangukiya706@gmail.com
EMAIL_PASS="your password"
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret
```
- Generate an App Password from your Google Account settings:
  1. Go to your Google Account settings
  2. Search App Password and enter a app name
  3. Copy the generated 16-character password and use it as EMAIL_PASS
### 3. Frontend Setup
```bash
# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate dev

# Start the frontend development server
npm run dev
```

### 4. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the backend server
node app.js
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## 📊 Future Enhancements

- **Appointment Scheduling:** Allow patients to book and manage appointments.
- **Payment Integration:** Support for online payments for consultations.
- **AI-based Recommendations:** Suggest medications and health tips based on patient history.


## 🛡 Security Considerations

- Password encryption using bcrypt.
- Role-based access control for secure data access.
- Secure API endpoints with JWT.

---
