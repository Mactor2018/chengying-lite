# CareBridge Integrated Flask Website

CareBridge is a Flask, Jinja, Bootstrap, and MySQL web application for nursing home communication and care coordination. The project combines resident profiles, role-aware staff access, family communication, schedule coordination, care records, reports, and security support pages into one integrated workspace.

The application is built from the provided Flask project structure and uses Jianning Liu's login and Personnel foundation as the base. Schedule, Communication, and Care Records workflows are integrated into the same visual system and database.

## Included Website Areas

- Personnel and Resident Profile Management
- DeepSeek-backed Personnel Analytics insights
- Communication and Service Inquiry
- Schedule and Appointment Management
- Care Records, Health Observations, and Reports
- Login, logout, email password recovery, and security governance pages

## Login Accounts

All seeded role accounts use password:

```text
123456
```

Recommended staff account for testing:

```text
Username: admin
Password: 123456
```

Other seeded accounts:

```text
supervisor
nurse.david
doctor.nora
caregiver.mia
family.olivia
elder.eleanor
```

## Main Routes

```text
/
/personnel
/residents
/users
/personnel-analytics
/conversations
/service-inquiries
/conversation-detail
/schedule
/appointment-requests
/schedule-analytics
/care-records
/care-records/add
/care-records/chart
/health-observations
/reports
/security
```

Legacy `.html` URLs such as `/residents.html`, `/schedule.html`, and `/care-records.html` redirect to the matching Flask routes.

## Database Coverage

The application uses the base database tables:

- `account`
- `resident`
- `residentaccount`
- `residentfriendship`
- `familybinding`
- `staffassignment`
- `internalgroup`
- `groupmembership`
- `auditlog`

The integrated modules automatically create additional tables on first use:

- Schedule: `scheduleevent`, `appointmentrequest`, `completionlog`
- Communication: `conversation`, `participant`, `chatmessage`, `serviceinquiry`
- Care Records: `carerecord`, `carerecordauditlog`

The automatic creation is implemented in:

```text
app/group_demo_db.py
```

## How To Run With Local MySQL

Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Initialize the database:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p carebridge < database/seed.sql
```

Configure local secrets by copying `.env.example` to `.env.local` and filling values as needed:

```text
CAREBRIDGE_DB_HOST=127.0.0.1
CAREBRIDGE_DB_PORT=3306
CAREBRIDGE_DB_USER=root
CAREBRIDGE_DB_PASSWORD=your_mysql_password
CAREBRIDGE_DB_NAME=carebridge

DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-v4-flash

CAREBRIDGE_SMTP_HOST=smtp.163.com
CAREBRIDGE_SMTP_PORT=465
CAREBRIDGE_SMTP_USER=your_email@example.com
CAREBRIDGE_SMTP_FROM=your_email@example.com
CAREBRIDGE_SMTP_PASSWORD=your_smtp_authorization_password
```

Run the Flask app:

```bash
python3 run.py
```

Open:

```text
http://127.0.0.1:5050/
```

## How To Run With Docker MySQL

If Docker Desktop is running the MySQL service on port `3309`, initialize the database with:

```bash
docker exec -i carebridge-mysql mysql -uroot -pchange-me < database/schema.sql
docker exec -i carebridge-mysql mysql -uroot -pchange-me carebridge < database/seed.sql
```

Then start the Flask app on a separate port:

```bash
CAREBRIDGE_DB_HOST=127.0.0.1 \
CAREBRIDGE_DB_PORT=3309 \
CAREBRIDGE_DB_USER=root \
CAREBRIDGE_DB_PASSWORD=change-me \
CAREBRIDGE_DB_NAME=carebridge \
PORT=5051 \
python3 run.py
```

Open:

```text
http://127.0.0.1:5051/
```

## Functional Highlights

1. Dashboard uses the updated CareBridge animated home page and public login entry.
2. Personnel pages manage resident, staff, family binding, resident account, friendship, and role-aware graph data.
3. Personnel Analytics can request DeepSeek insights when `DEEPSEEK_API_KEY` is configured.
4. Login supports quick demo sign-in, logout, and email verification-code password recovery.
5. Communication pages track conversations, messages, service inquiries, search, update, and delete workflows.
6. Schedule pages manage events, appointment requests, completion, cancellation, search, and charts.
7. Care Records pages support add, modify, soft delete, search, chart, and audit trail functions.

## Verification Completed

The current version was checked with:

```bash
python3 -m compileall app run.py
node --check app/static/js/carebridge.js
node --check app/static/js/charts.js
```

Route smoke tests passed for all main pages after logging in as `admin`, and database write tests passed for:

- Add care record
- Add schedule event
- Send conversation message
- Create service inquiry

## Notes

- The visual style follows the midterm dashboard direction: dark left navigation, light workspace, compact cards, tables, and operational forms.
- The project includes the full team page structure while keeping Mingrui Li's Care Records module ready for individual database-function evaluation.
