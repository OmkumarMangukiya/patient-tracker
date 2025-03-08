# 🏥 Patient Tracker

**Patient Tracker** is a healthcare management software designed to help doctors efficiently monitor and manage their patients' health. The system allows doctors to track health trends, manage medications, and receive alerts for critical health updates. Patients can log their symptoms, adhere to medication schedules, and stay connected with their doctors through a user-friendly interface.



## 📋 Features

### 1. **Authentication System**
- **Signup & Login:** Separate routes for patients and doctors using a role-based authentication system.
- **Security:** Password encryption and role-based access control.

### 2. **Doctor Dashboard**
- **Patient Management:** View, add, or update patient information.
- **Health Monitoring:** Access patients' health metrics like blood pressure, blood sugar, heart rate, etc.
- **Alerts System:** Get notifications for missed medications and critical health updates.
- **Messaging System:** Send messages to patients about medication dosages and alerts.

### 3. **Patient Dashboard**
- **Health Logs:** Patients can log symptoms, medications, and other health data.
- **Medication Reminders:** Receive alerts for medication schedules.
- **Reports:** View graphical reports of health trends over time.

### 4. **Health Monitoring Modules**
- **Customizable Modules:** Enable or disable disease-specific modules (like diabetes or hypertension) based on patient needs.
- **Real-time Tracking:** Track and display real-time data for various health metrics.

### 5. **Database Schema (PostgreSQL with Prisma)**
- **Tables:**
  - `User` (for authentication and roles)
  - `Patient` (for patient-specific data)
  - `Doctor` (for doctor-specific data)
  - `MedicalRecord` (for storing health data)
  - `Alert` (for medication reminders and alerts)
  - `Message` (for communication between doctors and patients)
- **Relationships:** Properly normalized with foreign keys for efficient querying.


## ⚙️ Tech Stack

- **Frontend:** React with Tailwind CSS
- **Backend:** Node.js with Express
- **Database:** PostgreSQL managed through Prisma ORM
- **Authentication:** JWT-based authentication for secure access
- **Styling:** Tailwind CSS for a clean and responsive UI




## 🚀 Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/patient-tracker.git && cd patient-tracker
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure PostgreSQL:**
   - In the `.env` file, update your PostgreSQL URL:
     ```env
     DATABASE_URL="postgresql://postgres:omman@127.0.0.1:5432/pt1?schema=public"
     TOKEN_SECRET="mysecret"
     ```
4. **Run Prisma migrations:**
   ```bash
   npx prisma migrate dev
   ```
5. **Start the application:**
   ```bash
   npm run start
   ```


## 📊 Future Enhancements

- **Appointment Scheduling:** Allow patients to book and manage appointments.
- **Payment Integration:** Support for online payments for consultations.
- **AI-based Recommendations:** Suggest medications and health tips based on patient history.


## 🛡 Security Considerations

- Password encryption using bcrypt.
- Role-based access control for secure data access.
- Secure API endpoints with JWT.

---
