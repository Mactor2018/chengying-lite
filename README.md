# CareBridge Nursing Home Communication Platform

CareBridge is a static Bootstrap demo for a resident-centered nursing home communication and care coordination platform. The interface is designed around the resident profile as the central object, connecting staff, family members, conversations, schedules, care records, and daily reports in one workspace.

## Demo Scope

The demo implements the four core modules from the technical design report:

- **Personnel & Resident Profile Management**: resident profiles, user management, family binding context, staff assignment context, and permission settings.
- **Conversation & Service Inquiry**: resident-specific conversation spaces, unread indicators, inquiry status actions, and message sending.
- **Schedule & Appointment Management**: care schedules, activities, visit or video call appointments, request submission, approval, and schedule completion.
- **Care Records & Daily Status Reports**: daily care record forms, health observation forms, supervisor review, generated daily reports, and simple trend panels.

This is a front-end prototype. It uses in-browser demo data and `localStorage` so that interactions such as adding records, approving appointments, sending messages, and changing inquiry status can be tested without a backend.

## UI Direction

The UI follows a Feishu-inspired workspace style:

- Fixed dark left navigation on desktop with a light operational workspace.
- Responsive mobile layout that stacks navigation, header, list, and detail areas.
- Dynamic sidebar badges for dashboard workload and unread conversations.
- Distinct initials styles for station identity (`CB`), staff identity (`GT`), and resident identity (`EC`, `RW`, `MB`, `SD`).
- Bootstrap components for modals, forms, tabs, tables, badges, buttons, toasts, and responsive grids.

## How To Run

No build step is required. Open `index.html` directly in a browser:

```text
index.html
```

Because the demo is fully static, all required assets are loaded from local project files under `assets/`.

## Key Files

```text
index.html
assets/css/carebridge.css
assets/js/carebridge.js
assets/bootstrap/
assets/fonts/
```

## Verification

The current implementation was checked with:

```bash
node --check assets/js/carebridge.js
```

Additional browser automation checks covered:

- Rendering all main navigation views.
- Resident and user search.
- Adding residents and users.
- Sending conversation messages.
- Creating service inquiries.
- Creating schedules and appointment requests.
- Approving appointments.
- Submitting care records and health observations.
- Generating daily reports.
- Creating inquiries from reports.
- Dashboard and conversation badge updates.
- Desktop and mobile responsive layout behavior.

## Notes

- This prototype intentionally removes the previous landing-page template content and replaces it with the actual usable product workspace.
- Role switching is not shown in the header because this is a focused demo of the main staff workflow.
- Demo data is persisted in `localStorage`; clearing browser site data resets the app state.
