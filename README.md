# SmartSched: Intelligent Academic Timetable Manager

**SmartSched** is an automated scheduling platform designed to eliminate the headache of manual timetable creation in academic institutions . By balancing the availability of teachers, the capacity of classrooms, and the needs of students, it creates conflict-free schedules at the click of a button .

---

## 🌟 What it Does
Creating a school or college timetable is like solving a massive puzzle . **SmartSched** takes all your raw data—your list of teachers, subjects, rooms, and sections—and uses an intelligent generator to build the perfect schedule for everyone .

*   **Conflict-Free Scheduling:** Ensures no teacher is scheduled for two classes at once .
*   **Optimal Room Usage:** Guarantees no classroom is double-booked .
*   **Logical Flow:** Organizes a logical flow to the academic day for all student sections .

---

## 👥 User Roles
The system provides a tailored experience for three different types of users :

### 🎓 For Students
*   **Personalized View:** Access a clear, easy-to-read daily and weekly schedule .
*   **Real-time Updates:** Stay informed about where you need to be and which subject is being taught .

### 👩‍🏫 For Faculty
*   **Teaching Schedule:** View a dedicated dashboard showing your specific teaching hours .
*   **Subject Management:** Track the subjects assigned to you across different departments .

### 🏛️ For HODs & Administrators
*   **The "Brain" Center:** Manage the master list of departments, classrooms, and academic sessions .
*   **Automated Generation:** Use the built-in generator to create entire timetables instantly .
*   **Resource Management:** Easily add or edit faculty members, students, and classroom details .

---

## 🚀 Key Features
*   **Smart Timetable Generator:** An advanced algorithm that handles complex constraints to prevent scheduling conflicts .
*   **Role-Based Dashboards:** Unique interfaces for Students, Faculty, and Heads of Departments (HOD) .
*   **Centralized Database:** One place for all academic data—no more messy spreadsheets .
*   **Academic Session Tracking:** Organize schedules by semester or yearly terms .

---

## 🛠️ Tech Stack
Built on a modern and robust engine :

*   **Frontend:** **Next.js** and **Tailwind CSS** for a fast, responsive interface .
*   **Backend:** A powerful API built with **NestJS** .
*   **Database:** Secure data management using **Prisma** and a relational database .
*   **Deployment:** Configured for easy hosting via **Render** .

---

## 📂 Project Structure
```text
smartSched/
├── backend/      # NestJS API, Prisma schemas, and generator logic 
├── frontend/     # Next.js application and UI components 
└── render.yaml   # Deployment configuration 
