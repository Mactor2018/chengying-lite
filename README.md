# CareBridge Nursing Home Communication Platform

CareBridge is a static multi-page Bootstrap demo for a resident-centered nursing home communication and care coordination platform. The current implementation is primarily HTML + CSS + Bootstrap, with JavaScript used for form interactions, demo-state hydration, `localStorage` persistence, and local canvas analytics.

## Demo Scope

The demo implements the four core modules from the technical design report:

- **Personnel & Resident Profile Management**: resident profiles, user management, family binding context, staff assignment context, and permission settings.
- **Conversation & Service Inquiry**: resident-specific conversation spaces, unread indicators, inquiry status actions, and message sending.
- **Schedule & Appointment Management**: care schedules, activities, visit or video call appointments, request submission, approval, and schedule completion.
- **Care Records & Daily Status Reports**: daily care record forms, health observation forms, supervisor review, generated daily reports, and trend analytics.

This is a front-end prototype. It uses real `.html` pages and in-browser demo data so interactions such as adding records, approving appointments, sending messages, and changing inquiry status can be tested without a backend.

Each core module now has at least three independent static Bootstrap pages. `index.html` and `security.html` are supporting pages and are not counted toward the four core module page totals.

| Core module | Independent pages |
| --- | --- |
| Personnel & Resident Management | `residents.html`, `users.html`, `personnel-analytics.html` |
| Conversations & Service Inquiries | `conversations.html`, `service-inquiries.html`, `conversation-detail.html` |
| Schedule & Appointment Management | `schedule.html`, `appointment-requests.html`, `schedule-analytics.html` |
| Care Records & Health Observation | `care-records.html`, `health-observations.html`, `reports.html` |

## Course Operation Coverage

Each functional module is structured around the five required database operations, even though the current demo stores records in `localStorage` until the Flask/MySQL phase.

| Module | Add records | Modify records | Delete records | Search records | Visual analytics |
| --- | --- | --- | --- | --- | --- |
| Personnel & Resident Profiles | Add resident and account | Edit resident, edit account, freeze or activate account | Delete resident or account | Resident, care-level, user, phone, and role search | Care-level, role, and account-status charts |
| Conversations & Service Inquiries | Create inquiry and send message | Update inquiry status and archive conversation | Delete inquiry or archive conversation | Search resident, title, message, and status text | Inquiry-status and conversation-by-resident charts |
| Schedule & Appointments | Create schedule and appointment request | Edit schedule, complete schedule, approve or reject appointment | Cancel schedule and delete appointment request | Search resident, title, staff, type, date, and status text | Schedule-type, appointment-status, and task-completion charts |
| Care Records & Daily Reports | Submit care record, health observation, and daily report | Replace same-date care record and mark report reviewed | Delete care record or report | Search resident, date, caregiver, meal, mood, and status text | Meal, sleep, mood, activity, and completion charts |

## UI Direction

The UI follows a Feishu-inspired workspace style:

- Fixed dark left navigation on desktop with a light operational workspace.
- Responsive mobile layout that stacks navigation, header, list, and detail areas.
- Dynamic sidebar badges for dashboard workload and unread conversations.
- Distinct initials styles for station identity (`CB`), staff identity (`GT`), and resident identity (`EC`, `RW`, `MB`, `SD`).
- Bootstrap components for modals, forms, tabs, tables, badges, buttons, toasts, and responsive grids.
- Local canvas charts in `assets/js/charts.js` using a Chart.js-style `labels` and `values` data structure that can later be replaced by MySQL query results.

## How To Run

No build step is required. Open `index.html` directly in a browser:

```text
index.html
```

Because the demo is fully static, all required assets are loaded from local project files under `assets/`.

Main static pages:

```text
index.html
residents.html
users.html
personnel-analytics.html
conversations.html
service-inquiries.html
conversation-detail.html
schedule.html
appointment-requests.html
schedule-analytics.html
care-records.html
health-observations.html
reports.html
security.html
```

## Key Files

```text
index.html
residents.html
users.html
personnel-analytics.html
conversations.html
service-inquiries.html
conversation-detail.html
schedule.html
appointment-requests.html
schedule-analytics.html
care-records.html
health-observations.html
reports.html
security.html
assets/css/carebridge.css
assets/js/carebridge.js
assets/js/charts.js
assets/bootstrap/
assets/fonts/
future-backend/app.py
future-backend/database/schema.sql
future-backend/database/seed.sql
```

## Future Flask/MySQL Scaffold

The `future-backend/` directory is a non-invasive scaffold for the final database-driven version. It does not replace the static `index.html` demo.

- `future-backend/app.py`: minimal Flask app structure.
- `future-backend/database/schema.sql`: MySQL table design with alphanumeric table and field names.
- `future-backend/database/seed.sql`: seed data with at least three records for the proposed database tables.
- `future-backend/templates/`: starter templates for a route-based version.

## Verification

The current implementation was checked with:

```bash
node --check assets/js/carebridge.js
node --check assets/js/charts.js
```

Additional browser automation checks covered:

- Opening all main `.html` pages directly.
- Sidebar navigation with real page links.
- Resident and user search.
- Adding residents and users.
- Sending conversation messages.
- Creating service inquiries.
- Creating schedules and appointment requests.
- Approving appointments.
- Submitting care records and health observations.
- Generating daily reports.
- Creating inquiries from reports.
- Deleting or cancelling records in each module.
- Rendering local analytics charts.
- Dashboard and conversation badge updates.
- Desktop and mobile responsive layout behavior.

## Notes

- This prototype intentionally removes the previous landing-page template content and replaces it with actual usable product pages.
- Role switching is not shown in the header because this is a focused demo of the main staff workflow.
- Demo data is persisted in `localStorage`; clearing browser site data resets the app state.
