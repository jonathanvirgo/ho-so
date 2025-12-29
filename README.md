# Patient Management System (Benh Nhan)

A comprehensive web-based application for managing patient data, medical records, inventory, and diet plans. Built with Node.js, Express, and EJS.

## Features

- **Patient Management**: Manage patient records for various conditions (Hepatitis, Tetanus, Liver Surgery, etc.).
- **Inventory & Warehouse**: Track stock, receipts, and issues for medical supplies and food.
- **Diet & Ration Building**: Construct daily and weekly menus, calculate ingredients, and manage food rations.
- **Research Data**: Collect and manage research data related to patients.
- **Admin & Security**: Role-based access control, audit logging (system activities, authentication logs), and user management.
- **Dual Database Support**: Configurable for MySQL or PostgreSQL.
- **Integration**: Google Sheets/Docs integration, Telegram notifications.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS (Embedded JavaScript templating), Bootstrap (implied by typical usage), jQuery (implied)
- **Database**: MySQL / PostgreSQL (via `mysql2` and `pg`)
- **Authentication**: Passport.js, JWT (JSON Web Tokens)
- **Other Tools**: 
  - `sequelize` / `prisma` (implied by database structure)
  - `exceljs`, `docx` for reporting
  - `googleapis` for Google integration

## Prerequisites

- [Node.js](https://nodejs.org/) (Recommended: LTS version)
- MySQL or PostgreSQL database instance
- Google Cloud Service Account (for specific features)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd benh-nhan
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Copy the example environment file and update it with your credentials.
    ```bash
    cp .env_example .env
    ```
    Update `.env` with your database connection, secret keys, and API keys:
    - `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`
    - `JWT_SECRET`, `SECRETKEYRECAPTCHA`
    - `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`

4.  **Database Setup:**
    Ensure your database is running and the schema is imported (check `database/` folder for SQL scripts).

5.  **Run the Application:**
    - For development:
      ```bash
      npm run dev
      ```
    - For production:
      ```bash
      npm start
      ```
    The app generally runs on port `4000` (default).

## Project Structure

- `bin/`: Application entry point scripts.
- `config/`: Configuration files (Database, etc.).
- `controllers/`: Logic for handling requests.
- `database/`: SQL dumps and migration scripts.
- `public/`: Static assets (CSS, JS, Images).
- `routes/`: API and view route definitions.
- `services/`: Business logic and utility services.
- `views/`: EJS templates for the frontend.

## License

[Internal/Proprietary]
