# CvSU Reporting System

A mobile application for Cavite State University (CvSU) students and administrators to report issues on campus, categorized by colleges.

## Features

- **User Roles**: Super Admin, College Admins, and Students.
- **Student Registration**: Students can register using their @cvsu.edu.ph email.
- **Report Submission**: Students can submit reports with location, image, description, date, and college category (CAS, CCJ, CEIT, CEMDS, or Unknown).
- **Admin Dashboard**: College admins view and manage reports for their assigned college. Super admin can create college admin accounts and view all reports.
- **Authentication**: Role-based login system.

## Technologies Used

- React Native
- Expo
- TypeScript
- AsyncStorage for local data persistence
- Expo Image Picker for image selection
- Expo Location for GPS coordinates

## Colleges

Reports can be categorized under:
- CAS (College of Arts and Sciences)
- CCJ (College of Criminal Justice)
- CEIT (College of Engineering and Information Technology)
- CEMDS (College of Economics, Management, and Development Studies)
- Unknown

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   Or run in web mode:

   ```bash
   npm run web
   ```

## Usage

- **Login**: Choose role (Student, Admin, Super Admin) and enter email.
- **Super Admin**: Create admin accounts for colleges.
- **College Admin**: View and update report statuses for their college.
- **Students**: Register if new, select college, and submit reports with image and location.

## Permissions

The app requires permissions for:
- Media library access (for image selection)
- Location access (for GPS coordinates)

Grant these permissions when prompted.
