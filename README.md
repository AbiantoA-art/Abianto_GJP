## GETTING STARTED LOCALLY

### 1. Clone & Configure
```bash
git clone https://github.com/organization/Government-Job-Portal.git
cd Government-Job-Portal

# Configure backend environment
cp .env.example backend/.env
```

### 2. Initialize Database
Ensure MySQL is running on `localhost:3306`, then:
```bash
cd backend
npm install
npm run init-db
npm run seed:admin
```
### 3. Start Backend Development Server
```bash
npm run dev
# Backend listening at http://localhost:5000
```
### 4. Start Frontend Development Server
```bash
In a second terminal:
cd frontend
npm install
npm run dev
# Frontend listening at http://localhost:5173