# -*- encoding: utf-8 -*-

from flask import redirect, render_template, url_for

from app import app
from app.auth import current_account


PAGE_REGISTRY = [
    {
        "key": "dashboard",
        "slug": "",
        "template": "pages/dashboard.html",
        "title": "Dashboard",
        "eyebrow": "Resident-centered care platform",
        "nav_section": "Workspace",
        "icon": "fa-th-large",
    },
    {
        "key": "personnel",
        "slug": "personnel",
        "template": "pages/personnel.html",
        "title": "Personnel Network",
        "eyebrow": "Role-based relationship graph",
        "nav_section": "Personnel",
        "icon": "fa-sitemap",
    },
    {
        "key": "residents",
        "slug": "residents",
        "template": "pages/residents.html",
        "title": "Residents",
        "eyebrow": "Personnel & resident profile management",
        "nav_section": "Personnel",
        "icon": "fa-id-card-o",
    },
    {
        "key": "users",
        "slug": "users",
        "template": "pages/users.html",
        "title": "User Management",
        "eyebrow": "Account and permission controls",
        "nav_section": "Personnel",
        "icon": "fa-users",
    },
    {
        "key": "personnelAnalytics",
        "slug": "personnel-analytics",
        "template": "pages/personnel-analytics.html",
        "title": "Personnel Analytics",
        "eyebrow": "Resident and staff record charts",
        "nav_section": "Personnel",
        "icon": "fa-bar-chart",
    },
    {
        "key": "conversations",
        "slug": "conversations",
        "template": "pages/conversations.html",
        "title": "Conversations",
        "eyebrow": "Conversation inbox and unread triage",
        "nav_section": "Conversation",
        "icon": "fa-comments",
    },
    {
        "key": "serviceInquiries",
        "slug": "service-inquiries",
        "template": "pages/service-inquiries.html",
        "title": "Service Inquiries",
        "eyebrow": "Inquiry tracking and staff response workflow",
        "nav_section": "Conversation",
        "icon": "fa-question-circle",
    },
    {
        "key": "conversationDetail",
        "slug": "conversation-detail",
        "template": "pages/conversation-detail.html",
        "title": "Conversation Detail",
        "eyebrow": "Resident conversation thread and linked inquiry",
        "nav_section": "Conversation",
        "icon": "fa-commenting-o",
    },
    {
        "key": "schedule",
        "slug": "schedule",
        "template": "pages/schedule.html",
        "title": "Schedule",
        "eyebrow": "Care task and appointment schedule board",
        "nav_section": "Schedule",
        "icon": "fa-calendar-check-o",
    },
    {
        "key": "appointmentRequests",
        "slug": "appointment-requests",
        "template": "pages/appointment-requests.html",
        "title": "Appointment Requests",
        "eyebrow": "Family visit and video call approvals",
        "nav_section": "Schedule",
        "icon": "fa-video-camera",
    },
    {
        "key": "scheduleAnalytics",
        "slug": "schedule-analytics",
        "template": "pages/schedule-analytics.html",
        "title": "Schedule Analytics",
        "eyebrow": "Schedule and appointment record charts",
        "nav_section": "Schedule",
        "icon": "fa-line-chart",
    },
    {
        "key": "care",
        "slug": "care-records",
        "template": "pages/care-records.html",
        "title": "Care Records",
        "eyebrow": "Daily care records and supervisor review",
        "nav_section": "Care Records",
        "icon": "fa-heartbeat",
    },
    {
        "key": "healthObservations",
        "slug": "health-observations",
        "template": "pages/health-observations.html",
        "title": "Health Observations",
        "eyebrow": "Nurse vital signs and medication notes",
        "nav_section": "Care Records",
        "icon": "fa-stethoscope",
    },
    {
        "key": "reports",
        "slug": "reports",
        "template": "pages/reports.html",
        "title": "Daily Reports",
        "eyebrow": "Family-readable daily status report",
        "nav_section": "Care Records",
        "icon": "fa-file-text-o",
    },
    {
        "key": "settings",
        "slug": "security",
        "template": "pages/security.html",
        "title": "Security",
        "eyebrow": "RBAC, resident binding, and audit trail",
        "nav_section": "Security",
        "icon": "fa-shield",
    },
]

SECTION_ORDER = ["Workspace", "Personnel", "Conversation", "Schedule", "Care Records", "Security"]
PUBLIC_PAGE_KEYS = {"dashboard"}
ALL_PAGE_KEYS = {page["key"] for page in PAGE_REGISTRY}
STAFF_PAGE_KEYS = {"dashboard", "personnel", "residents"}
ROLE_PAGE_KEYS = {
    "Admin": ALL_PAGE_KEYS,
    "Nursing Supervisor": STAFF_PAGE_KEYS | {
        "personnelAnalytics",
        "conversations",
        "serviceInquiries",
        "conversationDetail",
        "schedule",
        "appointmentRequests",
        "scheduleAnalytics",
        "care",
        "healthObservations",
        "reports",
    },
    "Nurse": STAFF_PAGE_KEYS | {
        "conversations",
        "serviceInquiries",
        "conversationDetail",
        "schedule",
        "care",
        "healthObservations",
        "reports",
    },
    "Doctor": STAFF_PAGE_KEYS | {
        "conversations",
        "serviceInquiries",
        "conversationDetail",
        "schedule",
        "healthObservations",
        "reports",
    },
    "Caregiver": STAFF_PAGE_KEYS | {
        "conversations",
        "serviceInquiries",
        "conversationDetail",
        "schedule",
        "care",
        "reports",
    },
    "Activity Staff": STAFF_PAGE_KEYS | {"schedule"},
    "Family Member": {"dashboard", "personnel"},
    "Elderly Resident": {"dashboard", "personnel"},
}


def _page_path(page):
    return "/" if page["slug"] == "" else f"/{page['slug']}"


for page in PAGE_REGISTRY:
    page["path"] = _page_path(page)

PAGES_BY_KEY = {page["key"]: page for page in PAGE_REGISTRY}
PAGES_BY_LEGACY_SLUG = {
    (page["slug"] or "index"): page
    for page in PAGE_REGISTRY
}


def page_url(key):
    return PAGES_BY_KEY[key]["path"]


def can_manage_personnel(account):
    return bool(account and account.get("role") == "Admin")


def role_tone_class(role):
    return {
        "Admin": "tone-admin",
        "Nursing Supervisor": "tone-supervisor",
        "Nurse": "tone-nurse",
        "Doctor": "tone-doctor",
        "Caregiver": "tone-caregiver",
        "Activity Staff": "tone-activity",
        "Family Member": "tone-family",
        "Elderly Resident": "tone-resident",
    }.get(role, "tone-staff")


def can_access_page(page, account):
    if account is None and page["key"] not in PUBLIC_PAGE_KEYS:
        return False
    if account is None:
        return True
    allowed_pages = ROLE_PAGE_KEYS.get(account.get("role"), {"dashboard", "personnel"})
    return page["key"] in allowed_pages


def nav_sections_for(account):
    grouped = []
    for section in SECTION_ORDER:
        pages = [
            page for page in PAGE_REGISTRY
            if page["nav_section"] == section and can_access_page(page, account)
        ]
        if pages:
            grouped.append((section, pages))
    return grouped


@app.context_processor
def inject_navigation():
    account = current_account()
    return {
        "nav_sections": nav_sections_for(account),
        "page_url": page_url,
        "current_account": account,
        "can_manage_personnel": can_manage_personnel(account),
        "role_tone_class": role_tone_class,
    }


def render_registered_page(page):
    account = current_account()
    if not can_access_page(page, account):
        if account is None:
            return redirect(url_for("auth.login_form"))
        return redirect(page_url("personnel"), code=302)
    return render_template(page["template"], page=page)


@app.get("/")
def index():
    return render_registered_page(PAGES_BY_KEY["dashboard"])


@app.get("/<legacy_slug>.html")
def legacy_redirect(legacy_slug):
    page = PAGES_BY_LEGACY_SLUG.get(legacy_slug)
    if page is None:
        return render_template("page-404.html", page=PAGES_BY_KEY["dashboard"]), 404
    return redirect(page["path"], code=302)


@app.get("/<slug>")
def page(slug):
    page_config = PAGES_BY_LEGACY_SLUG.get(slug)
    if page_config is None or page_config["slug"] == "":
        return render_template("page-404.html", page=PAGES_BY_KEY["dashboard"]), 404
    return render_registered_page(page_config)
