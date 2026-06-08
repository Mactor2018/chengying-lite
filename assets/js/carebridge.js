(function () {
    "use strict";

    var STORAGE_KEY = "carebridge-state-v1";
    var today = "2026-06-08";
    var filters = {
        residentSearch: "",
        residentCare: "All care levels",
        userSearch: "",
        userRole: "All roles",
        conversationSearch: "",
        inquirySearch: "",
        scheduleSearch: "",
        appointmentSearch: "",
        scheduleType: "All types",
        careSearch: "",
        observationSearch: "",
        reportSearch: ""
    };
    var PAGE_URLS = {
        dashboard: "index.html",
        residents: "residents.html",
        personnelAnalytics: "personnel-analytics.html",
        conversations: "conversations.html",
        serviceInquiries: "service-inquiries.html",
        conversationDetail: "conversation-detail.html",
        schedule: "schedule.html",
        appointmentRequests: "appointment-requests.html",
        scheduleAnalytics: "schedule-analytics.html",
        care: "care-records.html",
        healthObservations: "health-observations.html",
        reports: "reports.html",
        users: "users.html",
        settings: "security.html"
    };

    var defaultState = {
        view: "dashboard",
        role: "Supervisor",
        selectedResidentId: "r1",
        activeConversationId: "c1",
        selectedReportId: "dr1",
        users: [
            { id: "u1", name: "Grace Turner", phone: "555-0101", role: "Nursing Supervisor", department: "Care Management", status: "Active", residents: ["r1", "r2", "r3", "r4"] },
            { id: "u2", name: "Mia Johnson", phone: "555-0102", role: "Caregiver", department: "Floor A", status: "Active", residents: ["r1", "r3"] },
            { id: "u3", name: "David Lee", phone: "555-0103", role: "Nurse", department: "Medical Team", status: "Active", residents: ["r1", "r2"] },
            { id: "u4", name: "Olivia Chen", phone: "555-0104", role: "Family Member", department: "Family Portal", status: "Active", residents: ["r1"] },
            { id: "u5", name: "Aaron Patel", phone: "555-0105", role: "Caregiver", department: "Floor B", status: "Frozen", residents: ["r2"] },
            { id: "u6", name: "Sophia Nguyen", phone: "555-0106", role: "Nurse", department: "Medical Team", status: "Active", residents: ["r3", "r4"] }
        ],
        residents: [
            {
                id: "r1",
                name: "Eleanor Carter",
                gender: "Female",
                age: 82,
                room: "A-308",
                bed: "Bed 2",
                floor: "Floor A",
                careLevel: "Level II Assisted",
                tags: ["Hypertension", "Mobility Risk"],
                status: "Active",
                admissionDate: "2025-09-16",
                primaryFamily: "Olivia Chen",
                emergencyContact: "Olivia Chen",
                caregiver: "Mia Johnson",
                nurse: "David Lee",
                supervisor: "Grace Turner",
                activityStaff: "Liu Fang",
                tone: ""
            },
            {
                id: "r2",
                name: "Robert Williams",
                gender: "Male",
                age: 76,
                room: "B-112",
                bed: "Bed 1",
                floor: "Floor B",
                careLevel: "Level I Assisted",
                tags: ["Diabetes", "Medication Reminder"],
                status: "Active",
                admissionDate: "2026-01-08",
                primaryFamily: "Noah Williams",
                emergencyContact: "Noah Williams",
                caregiver: "Aaron Patel",
                nurse: "David Lee",
                supervisor: "Grace Turner",
                activityStaff: "Liu Fang",
                tone: "tone-teal"
            },
            {
                id: "r3",
                name: "Margaret Brown",
                gender: "Female",
                age: 88,
                room: "C-205",
                bed: "Bed 3",
                floor: "Floor C",
                careLevel: "Level III Intensive",
                tags: ["Memory Care", "Fall Risk"],
                status: "Active",
                admissionDate: "2024-11-21",
                primaryFamily: "Emma Brown",
                emergencyContact: "Emma Brown",
                caregiver: "Mia Johnson",
                nurse: "Sophia Nguyen",
                supervisor: "Grace Turner",
                activityStaff: "Hannah Ford",
                tone: "tone-amber"
            },
            {
                id: "r4",
                name: "Samuel Davis",
                gender: "Male",
                age: 80,
                room: "A-216",
                bed: "Bed 1",
                floor: "Floor A",
                careLevel: "Level II Assisted",
                tags: ["Rehabilitation", "Low Sodium Diet"],
                status: "Active",
                admissionDate: "2025-06-03",
                primaryFamily: "Ava Davis",
                emergencyContact: "Ava Davis",
                caregiver: "Nora Smith",
                nurse: "Sophia Nguyen",
                supervisor: "Grace Turner",
                activityStaff: "Liu Fang",
                tone: "tone-violet"
            }
        ],
        schedules: [
            { id: "s1", residentId: "r1", title: "Blood pressure measurement", type: "Daily care task", start: "2026-06-08T09:00", end: "2026-06-08T09:15", location: "Room A-308", staff: "David Lee", visibility: "family_visible", repeat: "Daily", status: "Planned" },
            { id: "s2", residentId: "r1", title: "Calligraphy activity", type: "Activity schedule", start: "2026-06-08T10:00", end: "2026-06-08T10:45", location: "Activity Room 2", staff: "Liu Fang", visibility: "all_visible", repeat: "Weekly", status: "Planned" },
            { id: "s3", residentId: "r1", title: "Daughter video call", type: "Video call appointment", start: "2026-06-08T15:00", end: "2026-06-08T15:30", location: "Family Booth", staff: "Mia Johnson", visibility: "all_visible", repeat: "One-time", status: "Approved" },
            { id: "s4", residentId: "r2", title: "Medication reminder", type: "Medical schedule", start: "2026-06-08T20:00", end: "2026-06-08T20:10", location: "Room B-112", staff: "David Lee", visibility: "family_visible", repeat: "Daily", status: "Planned" },
            { id: "s5", residentId: "r3", title: "Walking support", type: "Daily care task", start: "2026-06-08T16:00", end: "2026-06-08T16:20", location: "Garden", staff: "Mia Johnson", visibility: "staff_only", repeat: "Daily", status: "Planned" }
        ],
        appointments: [
            { id: "a1", residentId: "r2", type: "Visit", family: "Noah Williams", time: "2026-06-09T14:30", purpose: "Weekend family visit review", status: "Pending" },
            { id: "a2", residentId: "r3", type: "Video call", family: "Emma Brown", time: "2026-06-08T19:00", purpose: "Evening family check-in", status: "Approved" }
        ],
        careRecords: [
            { id: "cr1", residentId: "r1", caregiver: "Mia Johnson", date: today, meal: "Normal", sleep: "Good", mood: "Stable", activity: "Joined activity", hygiene: "Completed", mobility: "Needs assistance", notes: "Asked to video call family this weekend.", visible: true },
            { id: "cr2", residentId: "r2", caregiver: "Aaron Patel", date: today, meal: "Ate less", sleep: "Average", mood: "Stable", activity: "Absent", hygiene: "Completed", mobility: "Independent", notes: "Preferred resting after lunch.", visible: true },
            { id: "cr3", residentId: "r3", caregiver: "Mia Johnson", date: today, meal: "Normal", sleep: "Woke up twice", mood: "Anxious", activity: "Short walk", hygiene: "Completed", mobility: "Unstable walking", notes: "Supervisor review recommended for fall-risk note.", visible: false }
        ],
        observations: [
            { id: "ho1", residentId: "r1", nurse: "David Lee", time: "2026-06-08T09:08", bloodPressure: "135/85", heartRate: 78, temperature: "36.6", bloodSugar: "5.8", medication: "Taken", notes: "Condition stable.", visible: true },
            { id: "ho2", residentId: "r2", nurse: "David Lee", time: "2026-06-08T08:45", bloodPressure: "128/80", heartRate: 74, temperature: "36.5", bloodSugar: "7.2", medication: "Taken", notes: "Blood sugar requires routine tracking.", visible: true }
        ],
        reports: [
            { id: "dr1", residentId: "r1", date: today, diet: "Breakfast and lunch were normal. Dinner intake will continue to be watched.", sleep: "Slept well and woke once at night.", mood: "Mood was stable and cooperative.", activity: "Joined the morning calligraphy activity.", health: "Blood pressure was 135/85. Nurse recorded stable condition.", notes: "Resident mentioned wanting a family video call this weekend.", status: "Reviewed" },
            { id: "dr2", residentId: "r2", date: today, diet: "Ate less than usual at lunch.", sleep: "Sleep quality was average.", mood: "Mood stayed stable.", activity: "Did not join the afternoon activity.", health: "Blood sugar was tracked by nurse.", notes: "Staff will encourage a short walk tomorrow.", status: "Generated" }
        ],
        conversations: [
            {
                id: "c1",
                residentId: "r1",
                type: "Family-staff conversation",
                title: "Daily care update",
                status: "pending_reply",
                unread: 2,
                messages: [
                    { sender: "Olivia Chen", role: "Family", content: "Could you tell me why Mom looked tired during yesterday's call?", time: "2026-06-08T08:20", outgoing: false },
                    { sender: "Mia Johnson", role: "Caregiver", content: "She slept well overall but woke once at night. I will keep an eye on her energy after lunch.", time: "2026-06-08T08:42", outgoing: true },
                    { sender: "Olivia Chen", role: "Family", content: "Thank you. Please let me know if the blood pressure reading changes.", time: "2026-06-08T08:51", outgoing: false }
                ]
            },
            {
                id: "c2",
                residentId: "r2",
                type: "Service inquiry",
                title: "Activity absence question",
                status: "processing",
                unread: 0,
                messages: [
                    { sender: "Noah Williams", role: "Family", content: "Why did Dad not join the activity today?", time: "2026-06-08T11:15", outgoing: false },
                    { sender: "Grace Turner", role: "Supervisor", content: "The caregiver is checking his lunch and rest notes before replying.", time: "2026-06-08T11:40", outgoing: true }
                ]
            },
            {
                id: "c3",
                residentId: "r3",
                type: "Staff internal conversation",
                title: "Fall-risk mobility review",
                status: "active",
                unread: 1,
                messages: [
                    { sender: "Mia Johnson", role: "Caregiver", content: "Margaret needed two-person assistance near the garden path.", time: "2026-06-08T16:28", outgoing: false },
                    { sender: "Sophia Nguyen", role: "Nurse", content: "Please add this to the care record. I will review tomorrow morning.", time: "2026-06-08T16:35", outgoing: true }
                ]
            }
        ],
        inquiries: [
            { id: "i1", conversationId: "c2", residentId: "r2", title: "Activity absence question", description: "Family asked why Robert did not join the afternoon activity.", createdBy: "Noah Williams", assignedTo: "Aaron Patel", status: "Processing", priority: "Normal", createdAt: "2026-06-08T11:15" },
            { id: "i2", conversationId: "c1", residentId: "r1", title: "Blood pressure follow-up", description: "Family wants explanation if blood pressure is higher than usual.", createdBy: "Olivia Chen", assignedTo: "David Lee", status: "Pending", priority: "High", createdAt: "2026-06-08T08:51" }
        ],
        auditLogs: [
            { id: "log1", actor: "Grace Turner", action: "Generated daily report", target: "Eleanor Carter", time: "2026-06-08T10:20" },
            { id: "log2", actor: "Mia Johnson", action: "Submitted care record", target: "Margaret Brown", time: "2026-06-08T16:40" }
        ]
    };

    var state = loadState();

    document.addEventListener("DOMContentLoaded", function () {
        state.view = currentPage();
        if (state.view === "conversationDetail") {
            markConversationRead(state.activeConversationId);
        }
        bindEvents();
        render();
    });

    function loadState() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return clone(defaultState);
            }
            var parsed = JSON.parse(stored);
            var merged = Object.assign(clone(defaultState), parsed);
            merged.role = "Supervisor";
            return merged;
        } catch (error) {
            return clone(defaultState);
        }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function currentPage() {
        var page = document.body ? document.body.dataset.page : "";
        return PAGE_URLS[page] ? page : "dashboard";
    }

    function navigateToView(view) {
        var target = PAGE_URLS[view] || PAGE_URLS.dashboard;
        state.view = PAGE_URLS[view] ? view : "dashboard";
        saveState();
        var currentPath = window.location.pathname.split("/").pop() || "index.html";
        if (currentPath === target) {
            render();
            return;
        }
        window.location.href = target;
    }

    function bindEvents() {
        document.addEventListener("click", handleClick);
        document.addEventListener("input", handleInput);
        document.addEventListener("change", handleChange);
        document.addEventListener("submit", handleSubmit);
        document.addEventListener("keydown", function (event) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                var input = document.getElementById("commandSearch");
                if (input) {
                    input.focus();
                }
            }
        });
    }

    function handleClick(event) {
        var viewButton = event.target.closest("[data-view]");
        if (viewButton) {
            state.view = viewButton.dataset.view;
            if (state.view === "conversations") {
                markConversationRead(state.activeConversationId);
            }
            saveState();
            render();
            return;
        }

        var residentButton = event.target.closest("[data-resident-id]");
        if (residentButton) {
            state.selectedResidentId = residentButton.dataset.residentId;
            if (state.view === "reports") {
                var report = state.reports.find(function (item) {
                    return item.residentId === state.selectedResidentId;
                });
                state.selectedReportId = report ? report.id : state.selectedReportId;
            }
            saveState();
            render();
            return;
        }

        var conversationButton = event.target.closest("[data-conversation-id]");
        if (conversationButton) {
            state.activeConversationId = conversationButton.dataset.conversationId;
            var conversation = getConversation(state.activeConversationId);
            if (conversation) {
                state.selectedResidentId = conversation.residentId;
            }
            saveState();
            navigateToView("conversationDetail");
            return;
        }

        var reportButton = event.target.closest("[data-report-id]");
        if (reportButton) {
            state.selectedReportId = reportButton.dataset.reportId;
            var selected = getReport(state.selectedReportId);
            if (selected) {
                state.selectedResidentId = selected.residentId;
            }
            saveState();
            render();
            return;
        }

        var actionButton = event.target.closest("[data-action]");
        if (!actionButton) {
            return;
        }

        var action = actionButton.dataset.action;
        if (action === "new-resident") {
            openResidentModal();
        } else if (action === "edit-resident") {
            openResidentModal(getResident(state.selectedResidentId));
        } else if (action === "delete-resident") {
            deleteResident(state.selectedResidentId);
        } else if (action === "new-user") {
            openUserModal();
        } else if (action === "edit-user") {
            openUserModal(getUser(actionButton.dataset.userId));
        } else if (action === "toggle-user") {
            toggleUserStatus(actionButton.dataset.userId);
        } else if (action === "delete-user") {
            deleteUser(actionButton.dataset.userId);
        } else if (action === "new-schedule") {
            openScheduleModal();
        } else if (action === "edit-schedule") {
            openScheduleModal(getSchedule(actionButton.dataset.scheduleId));
        } else if (action === "cancel-schedule") {
            cancelSchedule(actionButton.dataset.scheduleId);
        } else if (action === "book-appointment") {
            openAppointmentModal();
        } else if (action === "delete-appointment") {
            deleteAppointment(actionButton.dataset.appointmentId);
        } else if (action === "new-inquiry") {
            openInquiryModal();
        } else if (action === "approve-appointment" || action === "reject-appointment") {
            reviewAppointment(actionButton.dataset.appointmentId, action === "approve-appointment" ? "Approved" : "Rejected");
        } else if (action === "complete-schedule") {
            completeSchedule(actionButton.dataset.scheduleId);
        } else if (action === "set-inquiry-status") {
            setInquiryStatus(actionButton.dataset.inquiryId, actionButton.dataset.status);
        } else if (action === "archive-conversation") {
            archiveConversation(actionButton.dataset.archiveConversationId);
        } else if (action === "delete-inquiry") {
            deleteInquiry(actionButton.dataset.inquiryId);
        } else if (action === "delete-care-record") {
            deleteCareRecord(actionButton.dataset.recordId);
        } else if (action === "generate-report") {
            generateReport(state.selectedResidentId);
        } else if (action === "review-report") {
            reviewReport(state.selectedReportId);
        } else if (action === "delete-report") {
            deleteReport(state.selectedReportId);
        } else if (action === "ask-report") {
            createInquiryFromReport();
        } else if (action === "switch-view") {
            navigateToView(actionButton.dataset.targetView);
        } else if (action === "reset-demo") {
            resetDemo();
        } else if (action === "show-audit") {
            navigateToView("settings");
        }
    }

    function handleInput(event) {
        if (event.target.id === "residentSearch") {
            filters.residentSearch = event.target.value;
            renderResidents();
        } else if (event.target.id === "userSearch") {
            filters.userSearch = event.target.value;
            renderUsers();
        } else if (event.target.id === "conversationSearch") {
            filters.conversationSearch = event.target.value;
            if (state.view === "conversationDetail") {
                renderConversationDetail();
            } else {
                renderConversations();
            }
        } else if (event.target.id === "inquirySearch") {
            filters.inquirySearch = event.target.value;
            renderServiceInquiries();
        } else if (event.target.id === "scheduleSearch") {
            filters.scheduleSearch = event.target.value;
            renderSchedule();
        } else if (event.target.id === "appointmentSearch") {
            filters.appointmentSearch = event.target.value;
            renderAppointmentRequests();
        } else if (event.target.id === "careSearch") {
            filters.careSearch = event.target.value;
            renderCare();
        } else if (event.target.id === "observationSearch") {
            filters.observationSearch = event.target.value;
            renderHealthObservations();
        } else if (event.target.id === "reportSearch") {
            filters.reportSearch = event.target.value;
            renderReports();
        } else if (event.target.id === "commandSearch") {
            applyCommandSearch(event.target.value);
        }
    }

    function handleChange(event) {
        if (event.target.id === "residentCareFilter") {
            filters.residentCare = event.target.value;
            renderResidents();
        } else if (event.target.id === "userRoleFilter") {
            filters.userRole = event.target.value;
            renderUsers();
        } else if (event.target.id === "scheduleTypeFilter") {
            filters.scheduleType = event.target.value;
            renderSchedule();
        }
    }

    function handleSubmit(event) {
        if (event.target.id === "residentForm") {
            event.preventDefault();
            saveResidentForm();
        } else if (event.target.id === "userForm") {
            event.preventDefault();
            saveUserForm();
        } else if (event.target.id === "scheduleForm") {
            event.preventDefault();
            saveScheduleForm();
        } else if (event.target.id === "appointmentForm") {
            event.preventDefault();
            saveAppointmentForm();
        } else if (event.target.id === "inquiryForm") {
            event.preventDefault();
            saveInquiryForm();
        } else if (event.target.id === "messageForm") {
            event.preventDefault();
            sendMessage();
        } else if (event.target.id === "careRecordForm") {
            event.preventDefault();
            submitCareRecord();
        } else if (event.target.id === "healthObservationForm") {
            event.preventDefault();
            submitHealthObservation();
        }
    }

    function render() {
        state.view = currentPage();
        document.querySelectorAll("[data-page-link]").forEach(function (link) {
            link.classList.toggle("active", link.dataset.pageLink === state.view);
        });
        updateNavBadges();
        hydrateModalSelects();

        var viewTitleMap = {
            dashboard: ["Dashboard", "Resident-centered care platform"],
            residents: ["Residents", "Personnel & resident profile management"],
            personnelAnalytics: ["Personnel Analytics", "Resident and account record analytics"],
            conversations: ["Conversations", "Conversation inbox and unread triage"],
            serviceInquiries: ["Service Inquiries", "Inquiry workflow and status board"],
            conversationDetail: ["Conversation Detail", "Resident-centered message thread"],
            schedule: ["Schedule", "Planned care tasks, visits, and calls"],
            appointmentRequests: ["Appointment Requests", "Visit and video call approval"],
            scheduleAnalytics: ["Schedule Analytics", "Schedule and appointment record charts"],
            care: ["Care Records", "Actual care outcomes and health observations"],
            healthObservations: ["Health Observations", "Nurse vitals and medication notes"],
            reports: ["Daily Reports", "Family-readable resident status reports"],
            users: ["User Management", "RBAC users and account status"],
            settings: ["Security", "Permissions, audit log, and architecture"]
        };
        var title = viewTitleMap[state.view] || viewTitleMap.dashboard;
        document.getElementById("viewTitle").textContent = title[0];
        document.getElementById("viewEyebrow").textContent = title[1];

        if (state.view === "dashboard") {
            renderDashboard();
        } else if (state.view === "residents") {
            renderResidents();
        } else if (state.view === "personnelAnalytics") {
            renderPersonnelAnalytics();
        } else if (state.view === "conversations") {
            renderConversations();
        } else if (state.view === "serviceInquiries") {
            renderServiceInquiries();
        } else if (state.view === "conversationDetail") {
            renderConversationDetail();
        } else if (state.view === "schedule") {
            renderSchedule();
        } else if (state.view === "appointmentRequests") {
            renderAppointmentRequests();
        } else if (state.view === "scheduleAnalytics") {
            renderScheduleAnalytics();
        } else if (state.view === "care") {
            renderCare();
        } else if (state.view === "healthObservations") {
            renderHealthObservations();
        } else if (state.view === "reports") {
            renderReports();
        } else if (state.view === "users") {
            renderUsers();
        } else {
            renderSettings();
        }
        renderAnalytics();
    }

    function renderDashboard() {
        var resident = getResident(state.selectedResidentId);
        var pendingInquiries = openInquiries();
        var pendingAppointments = pendingAppointmentCount();
        var missingRecords = state.residents.filter(function (item) {
            return !hasCareRecord(item.id);
        });
        var todaySchedules = state.schedules.filter(function (item) {
            return item.start.indexOf(today) === 0;
        });

        setListPane(
            "Work Queue",
            "Current operational focus",
            [
                quickMetric("Pending inquiries", pendingInquiries.length, "danger"),
                quickMetric("Pending appointments", pendingAppointments, "warning"),
                quickMetric("Today schedules", todaySchedules.length, "primary"),
                quickMetric("Missing records", missingRecords.length, "warning")
            ].join("") +
            '<div class="section-title mt-3"><h2>Assigned Residents</h2><button class="btn btn-sm btn-light" type="button" data-action="switch-view" data-target-view="residents">Open</button></div>' +
            '<div class="entity-list">' + state.residents.map(renderResidentRow).join("") + "</div>" +
            '<div class="section-title mt-3"><h2>Pending Service Inquiries</h2></div>' +
            '<div class="entity-list">' + pendingInquiries.map(renderInquiryListRow).join("") + "</div>"
        );

        var rolePanel = renderRolePanel(resident);
        document.getElementById("detailPane").innerHTML =
            renderResidentHero(resident) +
            '<div class="metric-grid">' +
            metricTile("Residents", state.residents.length, "Total active profiles", "fa-id-card-o") +
            metricTile("Staff", activeStaffCount(), "Active staff accounts", "fa-users") +
            metricTile("Inquiries", pendingInquiries.length, "Pending or processing", "fa-comments") +
            metricTile("Completion", completionRate() + "%", "Care records today", "fa-check-circle-o") +
            "</div>" +
            '<div class="analytics-grid mb-3">' +
            chartCard("Resident care levels", "Database-ready resident distribution", "chartResidentsByCare") +
            chartCard("Inquiry status", "Service questions by workflow state", "chartInquiryStatus") +
            "</div>" +
            '<div class="module-grid mb-3">' +
            moduleCard("Personnel & Resident Profiles", "Manage resident-centered identities, family binding, staff assignment, and visibility.", "fa-id-card-o", "residents") +
            moduleCard("Conversation & Service Inquiry", "Keep family-staff questions trackable with owner, status, reply history, and resident context.", "fa-comments", "conversations") +
            moduleCard("Schedule & Appointment", "Plan care tasks, activities, family visits, video calls, and staff responsibilities.", "fa-calendar-check-o", "schedule") +
            moduleCard("Care Records & Daily Reports", "Record actual outcomes, health observations, family summaries, and trend dashboards.", "fa-heartbeat", "care") +
            "</div>" +
            rolePanel;
    }

    function renderResidents() {
        var residents = filteredResidents();
        setListPane(
            "Resident Profiles",
            "Search, filter, and open central resident files",
            '<div class="toolbar-line">' +
            '<input class="form-control" id="residentSearch" type="search" placeholder="Search name, room, tag" value="' + escapeHtml(filters.residentSearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-resident" aria-label="Add resident"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<select class="form-select mb-3" id="residentCareFilter">' +
            option("All care levels", filters.residentCare) +
            option("Level I Assisted", filters.residentCare) +
            option("Level II Assisted", filters.residentCare) +
            option("Level III Intensive", filters.residentCare) +
            "</select>" +
            '<div class="entity-list">' + residents.map(renderResidentRow).join("") + "</div>"
        );
        renderResidentDetail();
        renderAnalytics();
    }

    function renderResidentDetail() {
        var resident = getResident(state.selectedResidentId) || state.residents[0];
        if (!resident) {
            document.getElementById("detailPane").innerHTML = emptyState("No residents yet", "Add a resident to start the platform demo.");
            return;
        }
        var schedules = state.schedules.filter(function (item) {
            return item.residentId === resident.id;
        }).slice(0, 4);
        var records = state.careRecords.filter(function (item) {
            return item.residentId === resident.id;
        }).slice(0, 3);
        var conversations = state.conversations.filter(function (item) {
            return item.residentId === resident.id;
        });

        document.getElementById("detailPane").innerHTML =
            renderResidentHero(resident) +
            '<div class="analytics-grid mb-3">' +
            chartCard("Resident care levels", "Searchable profile records by care level", "chartResidentsByCare") +
            chartCard("Account roles", "Staff, family, and resident account mix", "chartUsersByRole") +
            "</div>" +
            '<ul class="nav nav-tabs mb-3" role="tablist">' +
            '<li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#residentOverview" type="button" role="tab">Overview</button></li>' +
            '<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#residentRelations" type="button" role="tab">Relations</button></li>' +
            '<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#residentPermissions" type="button" role="tab">Permissions</button></li>' +
            "</ul>" +
            '<div class="tab-content">' +
            '<div class="tab-pane fade show active" id="residentOverview" role="tabpanel">' +
            '<div class="info-grid mb-3">' +
            infoCell("Room", resident.room + " / " + resident.bed) +
            infoCell("Care level", resident.careLevel) +
            infoCell("Admission", resident.admissionDate) +
            infoCell("Primary family", resident.primaryFamily) +
            infoCell("Emergency contact", resident.emergencyContact) +
            infoCell("Status", resident.status) +
            "</div>" +
            '<div class="row g-3">' +
            '<div class="col-xl-6"><div class="section-title"><h2>Today Schedule</h2><button class="btn btn-sm btn-light" data-action="new-schedule" type="button">Create</button></div><div class="timeline">' + schedules.map(renderTimelineItem).join("") + "</div></div>" +
            '<div class="col-xl-6"><div class="section-title"><h2>Recent Care Records</h2><button class="btn btn-sm btn-light" data-action="switch-view" data-target-view="care" type="button">Open</button></div>' + renderRecordList(records) + "</div>" +
            "</div>" +
            '<div class="section-title mt-3"><h2>Recent Conversations</h2><button class="btn btn-sm btn-light" type="button" data-action="new-inquiry">Ask Staff</button></div>' +
            '<div class="entity-list">' + conversations.map(renderConversationRow).join("") + "</div>" +
            "</div>" +
            '<div class="tab-pane fade" id="residentRelations" role="tabpanel">' +
            renderRelationsTable(resident) +
            "</div>" +
            '<div class="tab-pane fade" id="residentPermissions" role="tabpanel">' +
            renderPermissionSettings(resident) +
            "</div>" +
            "</div>";
    }

    function renderPersonnelAnalytics() {
        setListPane(
            "Personnel Module Pages",
            "Three independent HTML pages for this core module",
            '<div class="entity-list">' +
            modulePageRow("Resident Profiles", "Add, edit, delete, and search resident profile records.", "residents.html", "fa-id-card-o") +
            modulePageRow("User Management", "Add, edit, delete, freeze, activate, and search staff or family accounts.", "users.html", "fa-users") +
            modulePageRow("Personnel Analytics", "Visual analytics from resident and account records.", "personnel-analytics.html", "fa-bar-chart") +
            "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Personnel & Resident Management</p><h2>Database record analytics</h2></div><span class="badge badge-soft">3-page module</span></div>' +
            '<div class="metric-grid">' +
            metricTile("Residents", state.residents.length, "Resident profile rows", "fa-id-card-o") +
            metricTile("Accounts", state.users.length, "Staff and family accounts", "fa-users") +
            metricTile("Active staff", activeStaffCount(), "Available care employees", "fa-user-md") +
            metricTile("Frozen accounts", countFrozenAccounts(), "Restricted login records", "fa-lock") +
            "</div>" +
            '<div class="analytics-grid mb-3">' +
            chartCard("Resident care levels", "Resident profiles grouped by care level", "chartResidentsByCare") +
            chartCard("Account roles", "Accounts grouped by RBAC role", "chartUsersByRole") +
            chartCard("Account status", "Active and frozen account records", "chartAccountStatus") +
            "</div>" +
            '<div class="soft-panel"><div class="section-title"><h2>Required module operations</h2><span class="badge badge-teal">Covered</span></div>' +
            '<div class="table-wrap"><table class="table align-middle mb-0"><thead><tr><th>Operation</th><th>Demo support</th></tr></thead><tbody>' +
            operationRow("Add", "Resident Profiles and User Management open Bootstrap modals for new records.") +
            operationRow("Modify", "Resident details and account rows expose edit/freeze/activate actions.") +
            operationRow("Delete", "Resident and account delete actions remove demo records after confirmation.") +
            operationRow("Search", "Resident, care level, user, phone, department, and role filters are available.") +
            operationRow("Visual analytics", "This page renders charts from resident and account records.") +
            "</tbody></table></div></div>";
        renderAnalytics();
    }

    function renderConversations() {
        var conversations = filteredConversations();
        setListPane(
            "Conversation Inbox",
            "Unread resident-specific communication",
            '<div class="toolbar-line">' +
            '<input class="form-control" id="conversationSearch" type="search" placeholder="Search resident, title, message" value="' + escapeHtml(filters.conversationSearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-inquiry" aria-label="Create inquiry"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<div class="entity-list">' + conversations.map(renderConversationRow).join("") + "</div>"
        );

        var unread = state.conversations.filter(function (conversation) {
            return Number(conversation.unread || 0) > 0;
        });
        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Inbox Summary</p><h2>Conversation Triage</h2></div><button class="btn btn-primary btn-sm" type="button" data-action="new-inquiry">Create Inquiry</button></div>' +
            '<div class="metric-grid">' +
            metricTile("Conversations", state.conversations.length, "Searchable message spaces", "fa-comments") +
            metricTile("Unread", unreadConversationCount(), "Messages needing review", "fa-bell-o") +
            metricTile("Open inquiries", openInquiries().length, "Pending or processing", "fa-question-circle") +
            metricTile("Residents", state.residents.length, "Linked profile contexts", "fa-id-card-o") +
            "</div>" +
            '<div class="row g-3 mb-3">' +
            '<div class="col-xl-6"><div class="section-title"><h2>Unread Conversations</h2><a class="btn btn-sm btn-light" href="conversation-detail.html">Open Detail</a></div><div class="entity-list">' + (unread.length ? unread.map(renderConversationRow).join("") : emptyState("No unread messages", "Opening a conversation detail clears its unread badge.")) + "</div></div>" +
            '<div class="col-xl-6"><div class="section-title"><h2>Open Service Inquiries</h2><a class="btn btn-sm btn-light" href="service-inquiries.html">Manage</a></div><div class="entity-list">' + openInquiries().map(renderInquiryListRow).join("") + "</div></div>" +
            "</div>" +
            '<div class="analytics-grid">' +
            chartCard("Inquiry status", "Pending, processing, replied, and closed records", "chartInquiryStatus") +
            chartCard("Conversations by resident", "Searchable message records grouped by resident", "chartConversationResidents") +
            "</div>";
        renderAnalytics();
    }

    function renderServiceInquiries() {
        var inquiries = filteredInquiries();
        setListPane(
            "Inquiry Board",
            "Create, search, update, and delete service inquiries",
            '<div class="toolbar-line">' +
            '<input class="form-control" id="inquirySearch" type="search" placeholder="Search resident, title, description, status" value="' + escapeHtml(filters.inquirySearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-inquiry" aria-label="Create inquiry"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<div class="entity-list">' + inquiries.map(renderInquiryListRow).join("") + "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Service Inquiry Records</p><h2>' + inquiries.length + ' inquiries</h2></div><button class="btn btn-primary" type="button" data-action="new-inquiry">Create Inquiry</button></div>' +
            '<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Inquiry</th><th>Resident</th><th>Assigned</th><th>Status</th><th>Priority</th><th>Action</th></tr></thead><tbody>' +
            inquiries.map(renderInquiryTableRow).join("") +
            "</tbody></table></div>" +
            '<div class="section-title mt-4"><div><p class="eyebrow mb-1">Inquiry Analytics</p><h2>Workflow distribution</h2></div><span class="badge badge-soft">Database-ready</span></div>' +
            '<div class="analytics-grid">' +
            chartCard("Inquiry status", "Inquiry records grouped by status", "chartInquiryStatus") +
            chartCard("Conversations by resident", "Inquiry-linked conversations by resident", "chartConversationResidents") +
            "</div>";
        renderAnalytics();
    }

    function renderConversationDetail() {
        var conversation = getConversation(state.activeConversationId) || state.conversations[0];
        if (!conversation) {
            document.getElementById("detailPane").innerHTML = emptyState("No conversations yet", "Create a service inquiry to start a resident communication space.");
            return;
        }
        state.activeConversationId = conversation.id;
        markConversationRead(conversation.id);
        saveState();
        updateNavBadges();
        var resident = getResident(conversation.residentId);
        var inquiry = state.inquiries.find(function (item) {
            return item.conversationId === conversation.id;
        });

        setListPane(
            "Conversation Detail",
            "Open another thread without leaving the detail page",
            '<div class="toolbar-line">' +
            '<input class="form-control" id="conversationSearch" type="search" placeholder="Search resident, title, message" value="' + escapeHtml(filters.conversationSearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-inquiry" aria-label="Create inquiry"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<div class="entity-list">' + filteredConversations().map(renderConversationRow).join("") + "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="chat-layout">' +
            '<div class="chat-panel">' +
            '<div class="chat-header">' +
            '<div class="section-title mb-0"><div><p class="eyebrow mb-1">' + escapeHtml(conversation.type) + '</p><h2>' + escapeHtml(conversation.title) + '</h2></div>' +
            '<span class="badge ' + statusBadge(conversation.status) + '">' + escapeHtml(formatStatus(conversation.status)) + "</span></div>" +
            "</div>" +
            '<div class="messages" id="messages">' + conversation.messages.map(renderMessage).join("") + "</div>" +
            '<form class="message-composer" id="messageForm">' +
            '<input class="form-control" id="messageInput" type="text" placeholder="Type a resident-centered reply..." required>' +
            '<button class="btn btn-primary" type="submit"><i class="fa fa-paper-plane" aria-hidden="true"></i></button>' +
            "</form>" +
            "</div>" +
            '<aside class="quick-profile">' +
            renderQuickProfile(resident) +
            (inquiry ? renderInquiryDetail(inquiry) : renderConversationInfo(conversation)) +
            chartCard("Inquiry status", "Pending, processing, replied, and closed records", "chartInquiryStatus") +
            chartCard("Conversations by resident", "Searchable message records grouped by resident", "chartConversationResidents") +
            "</aside>" +
            "</div>";
        scrollMessagesToBottom();
        renderAnalytics();
    }

    function renderSchedule() {
        var schedules = filteredSchedules().sort(function (a, b) {
            return new Date(a.start) - new Date(b.start);
        });
        setListPane(
            "Schedule Filters",
            "Plan first, record outcome later",
            '<input class="form-control mb-3" id="scheduleSearch" type="search" placeholder="Search resident, title, staff, status" value="' + escapeHtml(filters.scheduleSearch) + '">' +
            '<select class="form-select mb-3" id="scheduleTypeFilter">' +
            option("All types", filters.scheduleType) +
            option("Daily care task", filters.scheduleType) +
            option("Medical schedule", filters.scheduleType) +
            option("Activity schedule", filters.scheduleType) +
            option("Family visit appointment", filters.scheduleType) +
            option("Video call appointment", filters.scheduleType) +
            "</select>" +
            '<div class="d-grid gap-2 mb-3">' +
            '<button class="btn btn-primary" type="button" data-action="new-schedule"><i class="fa fa-plus me-2" aria-hidden="true"></i>Create Schedule</button>' +
            '<a class="btn btn-light" href="appointment-requests.html"><i class="fa fa-video-camera me-2" aria-hidden="true"></i>Appointment Requests</a>' +
            "</div>" +
            '<div class="entity-list">' +
            modulePageRow("Schedule Board", "Create, edit, complete, cancel, and search schedule records.", "schedule.html", "fa-calendar-check-o") +
            modulePageRow("Appointment Requests", "Create visit or video call requests and approve or reject them.", "appointment-requests.html", "fa-video-camera") +
            modulePageRow("Schedule Analytics", "Visual charts from schedule and appointment records.", "schedule-analytics.html", "fa-bar-chart") +
            "</div>"
        );

        var resident = getResident(state.selectedResidentId);
        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Staff Calendar</p><h2>June 8 Schedule Board</h2></div><span class="badge badge-soft">Visibility aware</span></div>' +
            '<div class="timeline mb-4">' + schedules.map(renderTimelineItem).join("") + "</div>" +
            '<div class="row g-3">' +
            '<div class="col-xl-6">' + renderElderlyTodayPanel(resident) + "</div>" +
            '<div class="col-xl-6">' + renderAppointmentWorkflow() + "</div>" +
            "</div>";
        renderAnalytics();
    }

    function renderAppointmentRequests() {
        var appointments = filteredAppointments();
        setListPane(
            "Appointment Requests",
            "Visit and video call workflow",
            '<input class="form-control mb-3" id="appointmentSearch" type="search" placeholder="Search resident, family, type, date, status" value="' + escapeHtml(filters.appointmentSearch) + '">' +
            '<div class="d-grid gap-2 mb-3">' +
            '<button class="btn btn-primary" type="button" data-action="book-appointment"><i class="fa fa-plus me-2" aria-hidden="true"></i>Book Appointment</button>' +
            '<a class="btn btn-light" href="schedule.html"><i class="fa fa-calendar-check-o me-2" aria-hidden="true"></i>Back to Schedule</a>' +
            "</div>" +
            '<div class="entity-list">' + appointments.map(renderAppointmentRow).join("") + "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Appointment Approval</p><h2>' + appointments.length + ' family visit and video call requests</h2></div><button class="btn btn-primary" type="button" data-action="book-appointment">New Request</button></div>' +
            '<div class="table-wrap mb-4"><table class="table align-middle"><thead><tr><th>Type</th><th>Resident</th><th>Family</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
            appointments.map(renderAppointmentTableRow).join("") +
            "</tbody></table></div>" +
            '<div class="row g-3">' +
            '<div class="col-xl-6">' + renderAppointmentWorkflow() + "</div>" +
            '<div class="col-xl-6">' + chartCard("Appointment status", "Pending, approved, and rejected requests", "chartAppointmentStatus") + "</div>" +
            "</div>";
        renderAnalytics();
    }

    function renderScheduleAnalytics() {
        setListPane(
            "Schedule Module Pages",
            "Three independent HTML pages for this core module",
            '<div class="entity-list">' +
            modulePageRow("Schedule Board", "Schedule CRUD and searchable calendar records.", "schedule.html", "fa-calendar-check-o") +
            modulePageRow("Appointment Requests", "Visit and video call request workflow.", "appointment-requests.html", "fa-video-camera") +
            modulePageRow("Schedule Analytics", "Charts from schedule and appointment records.", "schedule-analytics.html", "fa-bar-chart") +
            "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title mt-4"><div><p class="eyebrow mb-1">Schedule Analytics</p><h2>Database record charts</h2></div><span class="badge badge-soft">Chart-ready</span></div>' +
            '<div class="metric-grid">' +
            metricTile("Schedules", state.schedules.length, "Calendar records", "fa-calendar-check-o") +
            metricTile("Appointments", state.appointments.length, "Visit and call requests", "fa-video-camera") +
            metricTile("Pending", pendingAppointmentCount(), "Awaiting approval", "fa-hourglass-half") +
            metricTile("Completed", completedScheduleCount(), "Finished schedule rows", "fa-check-circle-o") +
            "</div>" +
            '<div class="analytics-grid">' +
            chartCard("Schedule types", "Task, activity, visit, and video records", "chartScheduleTypes") +
            chartCard("Appointment status", "Pending, approved, and rejected requests", "chartAppointmentStatus") +
            chartCard("Task completion", "Planned versus completed schedule records", "chartTaskCompletion") +
            "</div>" +
            '<div class="soft-panel mt-3"><div class="section-title"><h2>Required module operations</h2><span class="badge badge-teal">Covered</span></div>' +
            '<div class="table-wrap"><table class="table align-middle mb-0"><thead><tr><th>Operation</th><th>Demo support</th></tr></thead><tbody>' +
            operationRow("Add", "Create schedules and submit visit or video call appointment requests.") +
            operationRow("Modify", "Edit schedules, mark schedules complete, and approve or reject appointments.") +
            operationRow("Delete", "Cancel schedule records and delete appointment request records.") +
            operationRow("Search", "Filter schedule records by resident, title, staff, type, date, and status.") +
            operationRow("Visual analytics", "This page renders type, approval, and completion charts.") +
            "</tbody></table></div></div>";
        renderAnalytics();
    }

    function renderCare() {
        var careResidents = filteredCareResidents();
        var completionRows = careResidents.map(function (resident) {
            var complete = hasCareRecord(resident.id);
            return '<div class="completion-row"><div><strong>' + escapeHtml(resident.name) + '</strong><div class="entity-subtitle">' + escapeHtml(resident.room + " - " + resident.caregiver) + '</div></div><span class="badge ' + (complete ? "badge-teal" : "badge-amber") + '">' + (complete ? "Completed" : "Missing") + "</span></div>";
        }).join("");
        setListPane(
            "Record Completion",
            "Supervisor view for today",
            '<input class="form-control mb-3" id="careSearch" type="search" placeholder="Search resident, caregiver, mood, meal" value="' + escapeHtml(filters.careSearch) + '">' +
            '<div class="soft-panel mb-3"><div class="section-title"><h2>' + completionRate() + '% completed</h2><span class="badge badge-soft">Jun 8</span></div><div class="progress"><div class="progress-bar" style="width:' + completionRate() + '%"></div></div></div>' +
            completionRows +
            '<div class="entity-list mt-3">' +
            modulePageRow("Care Records", "Submit, replace, delete, and search daily care records.", "care-records.html", "fa-heartbeat") +
            modulePageRow("Health Observations", "Submit and search nurse vitals and medication notes.", "health-observations.html", "fa-stethoscope") +
            modulePageRow("Daily Reports", "Generate, review, delete, search, and analyze family reports.", "reports.html", "fa-file-text-o") +
            "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<ul class="nav nav-tabs mb-3" role="tablist">' +
            '<li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#careRecordTab" type="button" role="tab">Daily Care Record</button></li>' +
            '<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#reviewTab" type="button" role="tab">Supervisor Review</button></li>' +
            "</ul>" +
            '<div class="tab-content">' +
            '<div class="tab-pane fade show active" id="careRecordTab" role="tabpanel">' + renderCareRecordForm() + "</div>" +
            '<div class="tab-pane fade" id="reviewTab" role="tabpanel">' + renderSupervisorReview() + "</div>" +
            "</div>" +
            '<div class="section-title mt-4"><div><p class="eyebrow mb-1">Care Analytics</p><h2>Trend dashboard from record fields</h2></div><span class="badge badge-soft">Chart-ready</span></div>' +
            '<div class="analytics-grid">' +
            chartCard("Meal status", "Distribution from care record rows", "chartMealStatus") +
            chartCard("Sleep status", "Sleep quality by record category", "chartSleepStatus") +
            chartCard("Mood status", "Mood distribution from daily records", "chartMoodStatus") +
            chartCard("Activity participation", "Joined, absent, and short-walk records", "chartActivityStatus") +
            chartCard("Completion rate", "Completed versus missing today", "chartCareCompletion") +
            "</div>";
        renderAnalytics();
    }

    function renderHealthObservations() {
        var observations = filteredObservations();
        setListPane(
            "Health Observation Search",
            "Nurse vitals and medication records",
            '<input class="form-control mb-3" id="observationSearch" type="search" placeholder="Search resident, nurse, vitals, medication, notes" value="' + escapeHtml(filters.observationSearch) + '">' +
            '<div class="entity-list">' + observations.map(renderObservationRow).join("") + "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Health Observation</p><h2>Nurse record entry</h2></div><span class="badge badge-soft">Care module page 2</span></div>' +
            '<div class="row g-3 mb-4">' +
            '<div class="col-xl-7">' + renderHealthObservationForm() + "</div>" +
            '<div class="col-xl-5">' +
            '<div class="soft-panel h-100"><div class="section-title"><h2>Observation Records</h2><span class="badge badge-teal">' + observations.length + ' rows</span></div>' +
            '<div class="table-wrap"><table class="table align-middle mb-0"><thead><tr><th>Resident</th><th>Vitals</th><th>Medication</th><th>Time</th></tr></thead><tbody>' +
            observations.map(renderObservationTableRow).join("") +
            "</tbody></table></div></div></div></div>" +
            '<div class="analytics-grid">' +
            chartCard("Meal status", "Care record context for health review", "chartMealStatus") +
            chartCard("Mood status", "Mood distribution tied to care records", "chartMoodStatus") +
            chartCard("Completion rate", "Completed versus missing care records", "chartCareCompletion") +
            "</div>";
        renderAnalytics();
    }

    function renderReports() {
        if (!getReport(state.selectedReportId) && state.reports.length) {
            state.selectedReportId = state.reports[0].id;
        }
        var reports = filteredReports();
        setListPane(
            "Family Daily Reports",
            "Simplified status summaries",
            '<input class="form-control mb-3" id="reportSearch" type="search" placeholder="Search resident, date, mood, status" value="' + escapeHtml(filters.reportSearch) + '">' +
            '<div class="d-grid mb-3"><button class="btn btn-primary" type="button" data-action="generate-report"><i class="fa fa-refresh me-2" aria-hidden="true"></i>Generate Selected Report</button></div>' +
            '<div class="entity-list">' + reports.map(renderReportRow).join("") + "</div>"
        );
        var report = getReport(state.selectedReportId);
        if (!report) {
            document.getElementById("detailPane").innerHTML = emptyState("No reports generated", "Submit a care record and generate a family report.");
            return;
        }
        var resident = getResident(report.residentId);
        document.getElementById("detailPane").innerHTML =
            renderReportDetail(report, resident) +
            '<div class="section-title mt-4"><div><p class="eyebrow mb-1">Historical Trend Dashboard</p><h2>Recent Care Pattern</h2></div><span class="badge badge-soft">Prototype analytics</span></div>' +
            '<div class="analytics-grid">' +
            chartCard("Meal status", "Database rows grouped by meal status", "chartMealStatus") +
            chartCard("Sleep quality", "Database rows grouped by sleep status", "chartSleepStatus") +
            chartCard("Activity count", "Database rows grouped by activity status", "chartActivityStatus") +
            chartCard("Mood distribution", "Database rows grouped by mood status", "chartMoodStatus") +
            "</div>";
        renderAnalytics();
    }

    function renderUsers() {
        var users = filteredUsers();
        setListPane(
            "User Management",
            "Search, filter, freeze, and edit accounts",
            '<div class="toolbar-line">' +
            '<input class="form-control" id="userSearch" type="search" placeholder="Search user or phone" value="' + escapeHtml(filters.userSearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-user" aria-label="Add user"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<select class="form-select" id="userRoleFilter">' +
            option("All roles", filters.userRole) +
            option("Admin", filters.userRole) +
            option("Nursing Supervisor", filters.userRole) +
            option("Caregiver", filters.userRole) +
            option("Nurse", filters.userRole) +
            option("Activity Staff", filters.userRole) +
            option("Family Member", filters.userRole) +
            option("Elderly Resident", filters.userRole) +
            "</select>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">RBAC Account List</p><h2>' + users.length + ' users</h2></div><button class="btn btn-primary" type="button" data-action="new-user">Add User</button></div>' +
            '<div class="table-wrap"><table class="table align-middle"><thead><tr><th>User</th><th>Role</th><th>Department</th><th>Related residents</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
            users.map(function (user) {
                return '<tr><td><strong>' + escapeHtml(user.name) + '</strong><div class="entity-subtitle">' + escapeHtml(user.phone) + '</div></td><td>' + escapeHtml(user.role) + '</td><td>' + escapeHtml(user.department || "-") + '</td><td>' + user.residents.length + '</td><td><span class="badge ' + (user.status === "Active" ? "badge-teal" : "badge-amber") + '">' + user.status + '</span></td><td><div class="btn-group btn-group-sm"><button class="btn btn-light" type="button" data-action="edit-user" data-user-id="' + user.id + '">Edit</button><button class="btn btn-light" type="button" data-action="toggle-user" data-user-id="' + user.id + '">' + (user.status === "Active" ? "Freeze" : "Activate") + '</button><button class="btn btn-light text-danger" type="button" data-action="delete-user" data-user-id="' + user.id + '">Delete</button></div></td></tr>';
            }).join("") +
            "</tbody></table></div>" +
            '<div class="section-title mt-4"><div><p class="eyebrow mb-1">Personnel Analytics</p><h2>Database record charts</h2></div><span class="badge badge-soft">Chart-ready</span></div>' +
            '<div class="analytics-grid">' +
            chartCard("Account roles", "Users grouped by role", "chartUsersByRole") +
            chartCard("Account status", "Active and frozen account records", "chartAccountStatus") +
            chartCard("Resident care levels", "Resident profiles grouped by care level", "chartResidentsByCare") +
            "</div>";
        renderAnalytics();
    }

    function renderSettings() {
        setListPane(
            "Security Model",
            "RBAC + resident binding + operation log",
            '<div class="soft-panel mb-3"><strong>Permission foundation</strong><p class="mb-0 muted-copy">Users only access data connected to their role, assigned resident, or family binding.</p></div>' +
            '<div class="entity-list">' +
            settingsRow("Route protection", "Role-based page access") +
            settingsRow("Field visibility", "Family report switches") +
            settingsRow("Audit log", "Sensitive operations recorded") +
            settingsRow("Session timeout", "Required for deployment") +
            "</div>" +
            '<div class="d-grid mt-3"><button class="btn btn-light" type="button" data-action="reset-demo">Reset Demo Data</button></div>'
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Recommended Architecture</p><h2>Course Project B/S Stack</h2></div><span class="badge badge-soft">HTML + Bootstrap MVP</span></div>' +
            '<div class="module-grid mb-3">' +
            appInfoCard("Frontend", "Staff web portal, family mobile web portal, elderly tablet interface.", "fa-desktop") +
            appInfoCard("Backend", "Authentication, user permissions, resident profiles, conversations, schedules, care records, reports.", "fa-server") +
            appInfoCard("Database", "User, resident binding, conversation, schedule, care record, daily report, and audit log tables.", "fa-database") +
            appInfoCard("Security", "Password hashing, route protection, resident-binding access checks, and operation audit.", "fa-shield") +
            "</div>" +
            '<div class="section-title"><h2>Recent Audit Log</h2><span class="badge badge-amber">Traceable</span></div>' +
            '<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Time</th></tr></thead><tbody>' +
            state.auditLogs.map(function (log) {
                return '<tr><td>' + escapeHtml(log.actor) + '</td><td>' + escapeHtml(log.action) + '</td><td>' + escapeHtml(log.target) + '</td><td>' + formatDateTime(log.time) + '</td></tr>';
            }).join("") +
            "</tbody></table></div>";
    }

    function setListPane(title, subtitle, body) {
        updateNavBadges();
        document.getElementById("listPane").innerHTML =
            '<div class="pane-header"><p class="eyebrow mb-1">' + escapeHtml(subtitle) + '</p><h2>' + escapeHtml(title) + "</h2></div>" + body;
    }

    function updateNavBadges() {
        setNavBadge("dashboardBadge", dashboardWorkloadCount());
        setNavBadge("conversationBadge", unreadConversationCount());
    }

    function setNavBadge(id, count) {
        var badge = document.getElementById(id);
        if (!badge) {
            return;
        }
        badge.textContent = count > 0 ? count : "";
        badge.hidden = count <= 0;
    }

    function renderAnalytics() {
        if (!window.CareBridgeCharts) {
            return;
        }
        requestAnimationFrame(function () {
            window.CareBridgeCharts.render(buildAnalyticsPayload());
        });
    }

    function buildAnalyticsPayload() {
        return {
            residentsByCare: asChart(countBy(state.residents, function (resident) {
                return resident.careLevel;
            })),
            usersByRole: asChart(countBy(state.users, function (user) {
                return user.role;
            })),
            accountStatus: asChart(countBy(state.users, function (user) {
                return user.status;
            })),
            inquiriesByStatus: asChart(countBy(state.inquiries, function (inquiry) {
                return inquiry.status;
            })),
            conversationsByResident: asChart(countBy(state.conversations, function (conversation) {
                var resident = getResident(conversation.residentId);
                return resident ? resident.name : "Unassigned";
            })),
            schedulesByType: asChart(countBy(state.schedules, function (schedule) {
                return schedule.type;
            })),
            appointmentsByStatus: asChart(countBy(state.appointments, function (appointment) {
                return appointment.status;
            })),
            taskCompletion: asChart(countBy(state.schedules, function (schedule) {
                return schedule.status;
            })),
            mealStatus: asChart(countBy(state.careRecords, function (record) {
                return record.meal;
            })),
            sleepStatus: asChart(countBy(state.careRecords, function (record) {
                return record.sleep;
            })),
            moodStatus: asChart(countBy(state.careRecords, function (record) {
                return record.mood;
            })),
            activityStatus: asChart(countBy(state.careRecords, function (record) {
                return record.activity;
            })),
            careCompletion: asChart({
                Completed: completedRecordCount(),
                Missing: missingRecordCount()
            })
        };
    }

    function countBy(collection, accessor) {
        return collection.reduce(function (result, item) {
            var key = accessor(item) || "Unknown";
            result[key] = (result[key] || 0) + 1;
            return result;
        }, {});
    }

    function asChart(values) {
        var labels = Object.keys(values);
        return {
            labels: labels,
            values: labels.map(function (label) {
                return values[label];
            })
        };
    }

    function renderResidentHero(resident) {
        return '<div class="profile-heading">' +
            '<div class="profile-heading-main">' +
            '<div class="avatar resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="min-w-0"><p class="eyebrow mb-1">Resident Profile</p><h2>' + escapeHtml(resident.name) + '</h2><div class="entity-subtitle">' + escapeHtml(resident.room + " - " + resident.careLevel) + '</div></div>' +
            "</div>" +
            '<div class="d-flex flex-wrap gap-2 justify-content-end">' +
            '<button class="btn btn-light btn-sm" type="button" data-action="edit-resident"><i class="fa fa-pencil me-1" aria-hidden="true"></i>Edit</button>' +
            '<button class="btn btn-light btn-sm text-danger" type="button" data-action="delete-resident"><i class="fa fa-trash-o me-1" aria-hidden="true"></i>Delete</button>' +
            '<button class="btn btn-light btn-sm" type="button" data-action="book-appointment"><i class="fa fa-calendar me-1" aria-hidden="true"></i>Appointment</button>' +
            '<button class="btn btn-primary btn-sm" type="button" data-action="new-inquiry"><i class="fa fa-commenting-o me-1" aria-hidden="true"></i>Ask Staff</button>' +
            "</div>" +
            "</div>" +
            '<div class="tag-cloud mb-3">' + resident.tags.map(function (tag) {
                return '<span class="badge badge-soft">' + escapeHtml(tag) + "</span>";
            }).join("") + "</div>";
    }

    function renderRolePanel(resident) {
        if (state.role === "Family") {
            return '<div class="soft-panel">' +
                '<div class="section-title"><div><p class="eyebrow mb-1">Family Home</p><h2>' + escapeHtml(resident.name) + ' Today</h2></div><span class="badge badge-teal">Bound resident</span></div>' +
                '<div class="module-grid">' +
                appInfoCard("Daily status summary", "Mood stable, activity joined, blood pressure recorded.", "fa-file-text-o") +
                appInfoCard("Upcoming call", "Video call at 3:00 PM with caregiver support.", "fa-video-camera") +
                appInfoCard("Recent staff reply", "Caregiver replied to the sleep and energy question.", "fa-commenting-o") +
                appInfoCard("Quick action", "Contact staff or book a visit without leaving the resident file.", "fa-bolt") +
                "</div></div>";
        }
        if (state.role === "Elderly") {
            return renderElderlyTodayPanel(resident);
        }
        return '<div class="soft-panel">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Staff Priorities</p><h2>Today for ' + escapeHtml(resident.name) + '</h2></div><span class="badge badge-amber">3 tasks</span></div>' +
            '<div class="timeline">' +
            state.schedules.filter(function (item) { return item.residentId === resident.id; }).map(renderTimelineItem).join("") +
            "</div></div>";
    }

    function renderElderlyTodayPanel(resident) {
        var items = state.schedules.filter(function (item) {
            return item.residentId === resident.id && item.start.indexOf(today) === 0;
        }).slice(0, 4);
        return '<div class="soft-panel">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Elderly Today Page</p><h2>Large-button interface</h2></div><span class="badge badge-soft">' + escapeHtml(resident.name) + '</span></div>' +
            '<div class="elderly-panel mb-3">' +
            elderlyAction("Call Family", "fa-phone") +
            elderlyAction("Send Voice Message", "fa-microphone") +
            elderlyAction("Contact Caregiver", "fa-user-md") +
            elderlyAction("Play Reminder", "fa-volume-up") +
            "</div>" +
            '<div class="timeline">' + items.map(renderTimelineItem).join("") + "</div>" +
            "</div>";
    }

    function renderQuickProfile(resident) {
        var latest = latestReport(resident.id);
        return '<div class="app-card">' +
            '<div class="profile-heading-main mb-3"><div class="avatar avatar-small resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div><div><strong>' + escapeHtml(resident.name) + '</strong><div class="entity-subtitle">' + escapeHtml(resident.room + " - " + resident.careLevel) + '</div></div></div>' +
            '<div class="info-grid" style="grid-template-columns:1fr;">' +
            infoCell("Main caregiver", resident.caregiver) +
            infoCell("Primary family", resident.primaryFamily) +
            infoCell("Latest report", latest ? latest.mood : "No report") +
            "</div></div>";
    }

    function renderInquiryDetail(inquiry) {
        return '<div class="app-card">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Service Inquiry</p><h2>' + escapeHtml(inquiry.title) + '</h2></div><span class="badge ' + inquiryBadge(inquiry.status) + '">' + escapeHtml(inquiry.status) + '</span></div>' +
            '<p class="muted-copy">' + escapeHtml(inquiry.description) + '</p>' +
            '<div class="info-grid mb-3" style="grid-template-columns:1fr;">' +
            infoCell("Created by", inquiry.createdBy) +
            infoCell("Assigned to", inquiry.assignedTo) +
            infoCell("Priority", inquiry.priority) +
            "</div>" +
            '<div class="d-grid gap-2">' +
            '<button class="btn btn-light" type="button" data-action="set-inquiry-status" data-inquiry-id="' + inquiry.id + '" data-status="Processing">Mark Processing</button>' +
            '<button class="btn btn-light" type="button" data-action="set-inquiry-status" data-inquiry-id="' + inquiry.id + '" data-status="Supervisor Review">Request Supervisor Review</button>' +
            '<button class="btn btn-primary" type="button" data-action="set-inquiry-status" data-inquiry-id="' + inquiry.id + '" data-status="Closed">Close Inquiry</button>' +
            '<button class="btn btn-light" type="button" data-action="archive-conversation" data-archive-conversation-id="' + inquiry.conversationId + '">Archive Conversation</button>' +
            '<button class="btn btn-light text-danger" type="button" data-action="delete-inquiry" data-inquiry-id="' + inquiry.id + '">Delete Inquiry</button>' +
            "</div></div>";
    }

    function renderConversationInfo(conversation) {
        return '<div class="app-card"><p class="eyebrow mb-1">Conversation status</p><h3>' + escapeHtml(formatStatus(conversation.status)) + '</h3><p class="muted-copy mb-0">This space keeps resident-specific communication searchable and connected to care records or schedules.</p></div>';
    }

    function renderAppointmentWorkflow() {
        return '<div class="soft-panel">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Visit Workflow</p><h2>Family appointment approval</h2></div></div>' +
            '<div class="timeline">' +
            workflowItem("1", "Family submits request", "Select resident, date, time, type, and visit purpose.") +
            workflowItem("2", "Staff reviews", "Supervisor approves or rejects based on availability.") +
            workflowItem("3", "Schedule is created", "Approved request appears in resident, family, and caregiver calendars.") +
            "</div></div>";
    }

    function renderCareRecordForm() {
        return '<form class="soft-panel" id="careRecordForm">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Daily care record</p><h2>Submit actual care outcome</h2></div><span class="badge badge-soft">Caregiver</span></div>' +
            '<div class="row g-3">' +
            '<div class="col-md-6"><label class="form-label" for="careResidentField">Resident</label><select class="form-select" id="careResidentField" required>' + residentOptions(state.selectedResidentId) + '</select></div>' +
            '<div class="col-md-6"><label class="form-label" for="careDateField">Date</label><input class="form-control" id="careDateField" type="date" value="' + today + '" required></div>' +
            selectField("mealField", "Meal status", ["Normal", "Ate less", "Refused food"]) +
            selectField("sleepField", "Sleep status", ["Good", "Average", "Woke up several times"]) +
            selectField("moodField", "Mood status", ["Stable", "Happy", "Anxious", "Low"]) +
            selectField("activityField", "Activity participation", ["Joined activity", "Refused activity", "Absent", "Short walk"]) +
            selectField("hygieneField", "Hygiene care", ["Completed", "Needs follow-up", "Refused"]) +
            selectField("mobilityField", "Mobility status", ["Independent", "Needs assistance", "Unstable walking"]) +
            '<div class="col-12"><label class="form-label" for="careNotesField">Care notes</label><textarea class="form-control" id="careNotesField" rows="3" required></textarea></div>' +
            '<div class="col-12"><div class="form-check form-switch"><input class="form-check-input" id="careVisibleField" type="checkbox" checked><label class="form-check-label" for="careVisibleField">Visible to family report</label></div></div>' +
            '<div class="col-12"><button class="btn btn-primary" type="submit">Submit Care Record</button></div>' +
            "</div></form>";
    }

    function renderHealthObservationForm() {
        return '<form class="soft-panel" id="healthObservationForm">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Health observation</p><h2>Submit nurse observation</h2></div><span class="badge badge-teal">Nurse</span></div>' +
            '<div class="row g-3">' +
            '<div class="col-md-6"><label class="form-label" for="healthResidentField">Resident</label><select class="form-select" id="healthResidentField" required>' + residentOptions(state.selectedResidentId) + '</select></div>' +
            '<div class="col-md-6"><label class="form-label" for="healthTimeField">Record time</label><input class="form-control" id="healthTimeField" type="datetime-local" value="2026-06-08T09:00" required></div>' +
            '<div class="col-md-4"><label class="form-label" for="bloodPressureField">Blood pressure</label><input class="form-control" id="bloodPressureField" type="text" placeholder="135/85" required></div>' +
            '<div class="col-md-4"><label class="form-label" for="heartRateField">Heart rate</label><input class="form-control" id="heartRateField" type="number" min="30" max="180" required></div>' +
            '<div class="col-md-4"><label class="form-label" for="temperatureField">Temperature</label><input class="form-control" id="temperatureField" type="number" step="0.1" min="34" max="42" required></div>' +
            '<div class="col-md-6"><label class="form-label" for="bloodSugarField">Blood sugar</label><input class="form-control" id="bloodSugarField" type="number" step="0.1" required></div>' +
            '<div class="col-md-6"><label class="form-label" for="medicationField">Medication status</label><select class="form-select" id="medicationField"><option>Taken</option><option>Missed</option><option>Adjusted</option></select></div>' +
            '<div class="col-12"><label class="form-label" for="medicalNotesField">Medical notes</label><textarea class="form-control" id="medicalNotesField" rows="3" required></textarea></div>' +
            '<div class="col-12"><button class="btn btn-primary" type="submit">Submit Observation</button></div>' +
            "</div></form>";
    }

    function renderSupervisorReview() {
        var special = state.careRecords.filter(function (record) {
            return /review|risk|unstable|anxious/i.test(record.notes + " " + record.mobility + " " + record.mood);
        });
        var records = filteredCareRecords();
        return '<div class="row g-3">' +
            '<div class="col-lg-4">' + metricPanel("Total residents", state.residents.length, "fa-id-card-o") + "</div>" +
            '<div class="col-lg-4">' + metricPanel("Completed records", completedRecordCount(), "fa-check-circle-o") + "</div>" +
            '<div class="col-lg-4">' + metricPanel("Special notes", special.length, "fa-exclamation-circle") + "</div>" +
            '<div class="col-12"><div class="table-wrap"><table class="table align-middle"><thead><tr><th>Resident</th><th>Caregiver</th><th>Meal</th><th>Mood</th><th>Mobility</th><th>Visibility</th><th>Action</th></tr></thead><tbody>' +
            records.map(function (record) {
                var resident = getResident(record.residentId);
                return '<tr><td>' + escapeHtml(resident.name) + '</td><td>' + escapeHtml(record.caregiver) + '</td><td>' + escapeHtml(record.meal) + '</td><td>' + escapeHtml(record.mood) + '</td><td>' + escapeHtml(record.mobility) + '</td><td><span class="badge ' + (record.visible ? "badge-teal" : "badge-amber") + '">' + (record.visible ? "Family visible" : "Staff only") + '</span></td><td><button class="btn btn-sm btn-light text-danger" type="button" data-action="delete-care-record" data-record-id="' + record.id + '">Delete</button></td></tr>';
            }).join("") +
            "</tbody></table></div></div></div>";
    }

    function renderReportDetail(report, resident) {
        return '<div class="profile-heading">' +
            '<div class="profile-heading-main"><div class="avatar resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div><div><p class="eyebrow mb-1">Daily Status Report</p><h2>' + escapeHtml(resident.name) + '</h2><div class="entity-subtitle">' + escapeHtml(report.date) + ' - ' + escapeHtml(report.status) + '</div></div></div>' +
            '<div class="d-flex flex-wrap gap-2 justify-content-end"><button class="btn btn-light" type="button" data-action="ask-report"><i class="fa fa-question-circle me-1" aria-hidden="true"></i>Ask about report</button><button class="btn btn-light" type="button" data-action="review-report">Mark Reviewed</button><button class="btn btn-light text-danger" type="button" data-action="delete-report">Delete</button><button class="btn btn-primary" type="button" data-action="generate-report">Regenerate</button></div>' +
            "</div>" +
            '<div class="row g-3">' +
            reportBlock("Diet", report.diet) +
            reportBlock("Sleep", report.sleep) +
            reportBlock("Mood", report.mood) +
            reportBlock("Activity", report.activity) +
            reportBlock("Health Observation", report.health) +
            reportBlock("Care Notes", report.notes) +
            "</div>";
    }

    function renderResidentRow(resident) {
        var active = resident.id === state.selectedResidentId ? " active" : "";
        return '<button class="entity-row' + active + '" type="button" data-resident-id="' + resident.id + '">' +
            '<div class="avatar avatar-small resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="entity-body"><div class="entity-title">' + escapeHtml(resident.name) + '</div><div class="entity-subtitle">' + escapeHtml(resident.room + " - " + resident.careLevel) + '</div><div class="entity-meta">' + escapeHtml(resident.caregiver + " / " + resident.primaryFamily) + '</div></div>' +
            '<span class="status-dot' + (resident.careLevel.indexOf("III") > -1 ? " warning" : "") + '"></span>' +
            "</button>";
    }

    function renderConversationRow(conversation) {
        var resident = getResident(conversation.residentId);
        var active = conversation.id === state.activeConversationId ? " active" : "";
        return '<button class="entity-row' + active + '" type="button" data-conversation-id="' + conversation.id + '">' +
            '<div class="avatar avatar-small resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="entity-body"><div class="entity-title">' + escapeHtml(conversation.title) + (conversation.unread ? '<span class="badge bg-danger">' + conversation.unread + "</span>" : "") + '</div><div class="entity-subtitle">' + escapeHtml(resident.name + " - " + conversation.type) + '</div><div class="entity-meta">' + escapeHtml(formatStatus(conversation.status)) + '</div></div>' +
            "</button>";
    }

    function renderInquiryListRow(inquiry) {
        var resident = getResident(inquiry.residentId);
        return '<button class="entity-row" type="button" data-conversation-id="' + inquiry.conversationId + '">' +
            '<div class="avatar avatar-small resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="entity-body"><div class="entity-title">' + escapeHtml(inquiry.title) + '</div><div class="entity-subtitle">' + escapeHtml(resident.name + " - Assigned to " + inquiry.assignedTo) + '</div><div class="entity-meta">' + escapeHtml(inquiry.status) + '</div></div>' +
            '<span class="badge ' + inquiryBadge(inquiry.status) + '">' + escapeHtml(inquiry.priority) + "</span>" +
            "</button>";
    }

    function renderInquiryTableRow(inquiry) {
        var resident = getResident(inquiry.residentId);
        return '<tr><td><strong>' + escapeHtml(inquiry.title) + '</strong><div class="entity-subtitle">' + escapeHtml(inquiry.description) + '</div></td><td>' + escapeHtml(resident ? resident.name : "Unassigned") + '</td><td>' + escapeHtml(inquiry.assignedTo) + '</td><td><span class="badge ' + inquiryBadge(inquiry.status) + '">' + escapeHtml(inquiry.status) + '</span></td><td>' + escapeHtml(inquiry.priority) + '</td><td><div class="btn-group btn-group-sm"><button class="btn btn-light" type="button" data-action="set-inquiry-status" data-inquiry-id="' + inquiry.id + '" data-status="Processing">Processing</button><button class="btn btn-light" type="button" data-action="set-inquiry-status" data-inquiry-id="' + inquiry.id + '" data-status="Closed">Close</button><button class="btn btn-light text-danger" type="button" data-action="delete-inquiry" data-inquiry-id="' + inquiry.id + '">Delete</button></div></td></tr>';
    }

    function renderTimelineItem(item) {
        var resident = getResident(item.residentId);
        return '<div class="timeline-item">' +
            '<div class="timeline-time">' + formatTime(item.start) + '</div>' +
            '<div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(resident.name + " - " + item.location + " - " + item.staff) + '</p></div>' +
            '<div class="d-flex align-items-center gap-2 flex-wrap justify-content-end"><span class="badge ' + scheduleBadge(item.status) + '">' + escapeHtml(item.status) + '</span>' +
            '<button class="btn btn-sm btn-light" type="button" data-action="edit-schedule" data-schedule-id="' + item.id + '">Edit</button>' +
            (item.status === "Planned" ? '<button class="btn btn-sm btn-light" type="button" data-action="complete-schedule" data-schedule-id="' + item.id + '">Complete</button>' : "") +
            '<button class="btn btn-sm btn-light text-danger" type="button" data-action="cancel-schedule" data-schedule-id="' + item.id + '">Cancel</button>' +
            "</div></div>";
    }

    function renderAppointmentRow(item) {
        var resident = getResident(item.residentId);
        return '<div class="entity-row">' +
            '<div class="avatar avatar-small resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="entity-body"><div class="entity-title">' + escapeHtml(item.type) + '</div><div class="entity-subtitle">' + escapeHtml(resident.name + " - " + formatDateTime(item.time)) + '</div><div class="entity-meta">' + escapeHtml(item.family + ": " + item.purpose) + '</div></div>' +
            '<div class="d-flex flex-column gap-1 align-items-end"><span class="badge ' + scheduleBadge(item.status) + '">' + escapeHtml(item.status) + '</span>' +
            (item.status === "Pending" ? '<div class="btn-group btn-group-sm"><button class="btn btn-light" type="button" data-action="approve-appointment" data-appointment-id="' + item.id + '">Approve</button><button class="btn btn-light" type="button" data-action="reject-appointment" data-appointment-id="' + item.id + '">Reject</button></div>' : "") +
            '<button class="btn btn-sm btn-light text-danger" type="button" data-action="delete-appointment" data-appointment-id="' + item.id + '">Delete</button>' +
            "</div></div>";
    }

    function renderAppointmentTableRow(item) {
        var resident = getResident(item.residentId);
        return '<tr><td><strong>' + escapeHtml(item.type) + '</strong><div class="entity-subtitle">' + escapeHtml(item.purpose) + '</div></td><td>' + escapeHtml(resident ? resident.name : "Unassigned") + '</td><td>' + escapeHtml(item.family) + '</td><td>' + formatDateTime(item.time) + '</td><td><span class="badge ' + scheduleBadge(item.status) + '">' + escapeHtml(item.status) + '</span></td><td><div class="btn-group btn-group-sm">' + (item.status === "Pending" ? '<button class="btn btn-light" type="button" data-action="approve-appointment" data-appointment-id="' + item.id + '">Approve</button><button class="btn btn-light" type="button" data-action="reject-appointment" data-appointment-id="' + item.id + '">Reject</button>' : "") + '<button class="btn btn-light text-danger" type="button" data-action="delete-appointment" data-appointment-id="' + item.id + '">Delete</button></div></td></tr>';
    }

    function renderRecordList(records) {
        if (!records.length) {
            return emptyState("No care record", "Submit the first daily care record for this resident.");
        }
        return '<div class="entity-list">' + records.map(function (record) {
            return '<div class="entity-row"><div class="avatar avatar-small tone-teal"><i class="fa fa-heartbeat" aria-hidden="true"></i></div><div class="entity-body"><div class="entity-title">' + escapeHtml(record.date + " - " + record.mood) + '</div><div class="entity-subtitle">' + escapeHtml(record.meal + ", " + record.sleep + ", " + record.mobility) + '</div><div class="entity-meta">' + escapeHtml(record.notes) + '</div></div><span class="badge ' + (record.visible ? "badge-teal" : "badge-amber") + '">' + (record.visible ? "Visible" : "Staff only") + "</span></div>";
        }).join("") + "</div>";
    }

    function renderObservationRow(observation) {
        var resident = getResident(observation.residentId);
        return '<div class="entity-row"><div class="avatar avatar-small tone-teal"><i class="fa fa-stethoscope" aria-hidden="true"></i></div><div class="entity-body"><div class="entity-title">' + escapeHtml(resident ? resident.name : "Unassigned") + '</div><div class="entity-subtitle">' + escapeHtml(observation.bloodPressure + " BP / " + observation.heartRate + " HR / " + observation.temperature + " C") + '</div><div class="entity-meta">' + escapeHtml(observation.nurse + " - " + observation.medication + " - " + observation.notes) + '</div></div><span class="badge badge-soft">' + formatDateTime(observation.time) + "</span></div>";
    }

    function renderObservationTableRow(observation) {
        var resident = getResident(observation.residentId);
        return '<tr><td><strong>' + escapeHtml(resident ? resident.name : "Unassigned") + '</strong><div class="entity-subtitle">' + escapeHtml(observation.nurse) + '</div></td><td>' + escapeHtml(observation.bloodPressure + " BP / " + observation.heartRate + " HR / " + observation.temperature + " C") + '</td><td>' + escapeHtml(observation.medication) + '</td><td>' + formatDateTime(observation.time) + "</td></tr>";
    }

    function renderRelationsTable(resident) {
        return '<div class="row g-3">' +
            '<div class="col-xl-6"><div class="section-title"><h2>Assigned Staff</h2><span class="badge badge-soft">Active</span></div><div class="table-wrap"><table class="table align-middle"><thead><tr><th>Responsibility</th><th>Name</th><th>Status</th></tr></thead><tbody>' +
            relationRow("Main caregiver", resident.caregiver) +
            relationRow("Nurse", resident.nurse) +
            relationRow("Supervisor", resident.supervisor) +
            relationRow("Activity staff", resident.activityStaff) +
            "</tbody></table></div></div>" +
            '<div class="col-xl-6"><div class="section-title"><h2>Family Binding</h2><span class="badge badge-teal">Primary</span></div><div class="table-wrap"><table class="table align-middle"><thead><tr><th>Family member</th><th>Relationship</th><th>Permissions</th></tr></thead><tbody>' +
            '<tr><td>' + escapeHtml(resident.primaryFamily) + '</td><td>Daughter/Son</td><td>Daily report, appointment, service inquiry</td></tr>' +
            '<tr><td>' + escapeHtml(resident.emergencyContact) + '</td><td>Emergency contact</td><td>Emergency contact, report summary</td></tr>' +
            "</tbody></table></div></div>" +
            "</div>";
    }

    function renderPermissionSettings(resident) {
        return '<div class="soft-panel">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Visibility for ' + escapeHtml(resident.primaryFamily) + '</p><h2>Family binding permissions</h2></div></div>' +
            permissionSwitch("View daily care reports", true) +
            permissionSwitch("Create visit or video appointments", true) +
            permissionSwitch("View staff-only schedules", false) +
            permissionSwitch("Download health attachments", false) +
            '<p class="muted-copy mb-0 mt-3">In a backend implementation, each toggle maps to resident binding fields and is checked together with RBAC before data is returned.</p>' +
            "</div>";
    }

    function renderMessage(message) {
        return '<div class="message-row ' + (message.outgoing ? "outgoing" : "") + '"><div class="bubble"><strong>' + escapeHtml(message.sender) + '</strong><div>' + escapeHtml(message.content) + '</div><small>' + escapeHtml(message.role + " - " + formatDateTime(message.time)) + '</small></div></div>';
    }

    function renderReportRow(report) {
        var resident = getResident(report.residentId);
        var active = report.id === state.selectedReportId ? " active" : "";
        return '<button class="entity-row' + active + '" type="button" data-report-id="' + report.id + '">' +
            '<div class="avatar avatar-small resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="entity-body"><div class="entity-title">' + escapeHtml(resident.name) + '</div><div class="entity-subtitle">' + escapeHtml(report.date + " - " + report.mood) + '</div><div class="entity-meta">' + escapeHtml(report.status) + '</div></div>' +
            "</button>";
    }

    function quickMetric(label, value, tone) {
        var className = tone === "danger" ? "badge-red" : tone === "warning" ? "badge-amber" : "badge-soft";
        return '<div class="completion-row"><span>' + escapeHtml(label) + '</span><span class="badge ' + className + '">' + value + "</span></div>";
    }

    function metricTile(label, value, note, icon) {
        return '<div class="stat-tile"><div class="d-flex justify-content-between align-items-center"><span>' + escapeHtml(label) + '</span><i class="fa ' + icon + ' text-primary" aria-hidden="true"></i></div><strong>' + value + '</strong><span>' + escapeHtml(note) + "</span></div>";
    }

    function metricPanel(label, value, icon) {
        return '<div class="stat-tile"><div class="d-flex justify-content-between align-items-center"><span>' + escapeHtml(label) + '</span><i class="fa ' + icon + ' text-primary" aria-hidden="true"></i></div><strong>' + value + '</strong></div>';
    }

    function moduleCard(title, copy, icon, targetView) {
        return '<div class="app-card"><div class="card-icon"><i class="fa ' + icon + '" aria-hidden="true"></i></div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(copy) + '</p><button class="btn btn-sm btn-light" type="button" data-action="switch-view" data-target-view="' + targetView + '">Open Module</button></div>';
    }

    function modulePageRow(title, copy, href, icon) {
        return '<a class="entity-row" href="' + escapeHtml(href) + '"><div class="avatar avatar-small tone-violet"><i class="fa ' + icon + '" aria-hidden="true"></i></div><div class="entity-body"><div class="entity-title">' + escapeHtml(title) + '</div><div class="entity-subtitle">' + escapeHtml(copy) + '</div></div><i class="fa fa-angle-right muted-copy" aria-hidden="true"></i></a>';
    }

    function appInfoCard(title, copy, icon) {
        return '<div class="app-card"><div class="card-icon"><i class="fa ' + icon + '" aria-hidden="true"></i></div><h3>' + escapeHtml(title) + '</h3><p class="mb-0">' + escapeHtml(copy) + "</p></div>";
    }

    function chartCard(title, copy, id) {
        return '<div class="chart-card"><div class="section-title"><div><p class="eyebrow mb-1">' + escapeHtml(copy) + '</p><h3>' + escapeHtml(title) + '</h3></div></div><canvas class="chart-canvas" id="' + escapeHtml(id) + '" height="220" aria-label="' + escapeHtml(title) + ' chart"></canvas></div>';
    }

    function infoCell(label, value) {
        return '<div class="info-cell"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || "-") + "</strong></div>";
    }

    function reportBlock(title, value) {
        return '<div class="col-lg-6"><div class="report-block"><h3>' + escapeHtml(title) + '</h3><p class="mb-0 muted-copy">' + escapeHtml(value) + "</p></div></div>";
    }

    function operationRow(operation, support) {
        return '<tr><td><strong>' + escapeHtml(operation) + '</strong></td><td>' + escapeHtml(support) + "</td></tr>";
    }

    function renderTrendCard(title, rows) {
        return '<div class="app-card"><h3>' + escapeHtml(title) + '</h3><div class="trend-bars">' + rows.map(function (row) {
            return '<div class="bar-row"><span>' + escapeHtml(row[0]) + '</span><div class="bar-track"><div class="bar-fill ' + escapeHtml(row[2]) + '" style="width:' + row[1] + '%"></div></div><strong>' + row[1] + "%</strong></div>";
        }).join("") + "</div></div>";
    }

    function workflowItem(number, title, copy) {
        return '<div class="timeline-item"><div class="timeline-time">' + escapeHtml(number) + '</div><div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(copy) + '</p></div><span class="badge badge-soft">Step</span></div>';
    }

    function elderlyAction(label, icon) {
        return '<button class="elderly-action" type="button"><i class="fa ' + icon + '" aria-hidden="true"></i><strong>' + escapeHtml(label) + '</strong></button>';
    }

    function relationRow(role, name) {
        return '<tr><td>' + escapeHtml(role) + '</td><td>' + escapeHtml(name) + '</td><td><span class="badge badge-teal">Active</span></td></tr>';
    }

    function permissionSwitch(label, checked) {
        var id = "perm-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="' + id + '"' + (checked ? " checked" : "") + '><label class="form-check-label" for="' + id + '">' + escapeHtml(label) + "</label></div>";
    }

    function settingsRow(title, copy) {
        return '<div class="entity-row"><div class="avatar avatar-small tone-violet"><i class="fa fa-shield" aria-hidden="true"></i></div><div class="entity-body"><div class="entity-title">' + escapeHtml(title) + '</div><div class="entity-subtitle">' + escapeHtml(copy) + "</div></div></div>";
    }

    function selectField(id, label, values) {
        return '<div class="col-md-6"><label class="form-label" for="' + id + '">' + escapeHtml(label) + '</label><select class="form-select" id="' + id + '">' + values.map(function (value) {
            return '<option>' + escapeHtml(value) + "</option>";
        }).join("") + "</select></div>";
    }

    function emptyState(title, copy) {
        return '<div class="empty-state"><div><i class="fa fa-inbox" aria-hidden="true"></i><h2 class="h5">' + escapeHtml(title) + '</h2><p class="mb-0">' + escapeHtml(copy) + "</p></div></div>";
    }

    function filteredResidents() {
        var q = filters.residentSearch.trim().toLowerCase();
        return state.residents.filter(function (resident) {
            var matchesSearch = !q || [resident.name, resident.room, resident.careLevel, resident.primaryFamily, resident.caregiver].concat(resident.tags).join(" ").toLowerCase().indexOf(q) > -1;
            var matchesCare = filters.residentCare === "All care levels" || resident.careLevel === filters.residentCare;
            return matchesSearch && matchesCare;
        });
    }

    function filteredUsers() {
        var q = filters.userSearch.trim().toLowerCase();
        return state.users.filter(function (user) {
            var matchesSearch = !q || (user.name + " " + user.phone + " " + user.department).toLowerCase().indexOf(q) > -1;
            var matchesRole = filters.userRole === "All roles" || user.role === filters.userRole;
            return matchesSearch && matchesRole;
        });
    }

    function filteredConversations() {
        var q = filters.conversationSearch.trim().toLowerCase();
        return state.conversations.filter(function (conversation) {
            var resident = getResident(conversation.residentId);
            var messageText = conversation.messages.map(function (message) {
                return message.content;
            }).join(" ");
            return !q || (conversation.title + " " + conversation.type + " " + resident.name + " " + messageText).toLowerCase().indexOf(q) > -1;
        });
    }

    function filteredInquiries() {
        var q = filters.inquirySearch.trim().toLowerCase();
        return state.inquiries.filter(function (inquiry) {
            var resident = getResident(inquiry.residentId);
            var recordText = [
                inquiry.title,
                inquiry.description,
                inquiry.createdBy,
                inquiry.assignedTo,
                inquiry.status,
                inquiry.priority,
                resident ? resident.name : ""
            ].join(" ").toLowerCase();
            return !q || recordText.indexOf(q) > -1;
        });
    }

    function filteredSchedules() {
        var type = filters.scheduleType;
        var q = filters.scheduleSearch.trim().toLowerCase();
        return state.schedules.filter(function (schedule) {
            var resident = getResident(schedule.residentId);
            var recordText = [
                schedule.title,
                schedule.type,
                schedule.location,
                schedule.staff,
                schedule.status,
                schedule.start,
                resident ? resident.name : ""
            ].join(" ").toLowerCase();
            return (type === "All types" || schedule.type === type) && (!q || recordText.indexOf(q) > -1);
        });
    }

    function filteredAppointments() {
        var q = filters.appointmentSearch.trim().toLowerCase();
        return state.appointments.filter(function (appointment) {
            var resident = getResident(appointment.residentId);
            var recordText = [
                appointment.type,
                appointment.family,
                appointment.time,
                appointment.purpose,
                appointment.status,
                resident ? resident.name : ""
            ].join(" ").toLowerCase();
            return !q || recordText.indexOf(q) > -1;
        });
    }

    function filteredCareResidents() {
        var q = filters.careSearch.trim().toLowerCase();
        if (!q) {
            return state.residents;
        }
        return state.residents.filter(function (resident) {
            var recordText = resident.name + " " + resident.room + " " + resident.caregiver + " " + resident.careLevel;
            var relatedRecords = state.careRecords.filter(function (record) {
                return record.residentId === resident.id;
            }).map(function (record) {
                return [record.meal, record.sleep, record.mood, record.activity, record.mobility, record.notes].join(" ");
            }).join(" ");
            return (recordText + " " + relatedRecords).toLowerCase().indexOf(q) > -1;
        });
    }

    function filteredCareRecords() {
        var q = filters.careSearch.trim().toLowerCase();
        if (!q) {
            return state.careRecords;
        }
        return state.careRecords.filter(function (record) {
            var resident = getResident(record.residentId);
            var recordText = [
                resident ? resident.name : "",
                record.caregiver,
                record.date,
                record.meal,
                record.sleep,
                record.mood,
                record.activity,
                record.mobility,
                record.notes
            ].join(" ").toLowerCase();
            return recordText.indexOf(q) > -1;
        });
    }

    function filteredObservations() {
        var q = filters.observationSearch.trim().toLowerCase();
        if (!q) {
            return state.observations;
        }
        return state.observations.filter(function (observation) {
            var resident = getResident(observation.residentId);
            var recordText = [
                resident ? resident.name : "",
                observation.nurse,
                observation.time,
                observation.bloodPressure,
                observation.heartRate,
                observation.temperature,
                observation.bloodSugar,
                observation.medication,
                observation.notes
            ].join(" ").toLowerCase();
            return recordText.indexOf(q) > -1;
        });
    }

    function filteredReports() {
        var q = filters.reportSearch.trim().toLowerCase();
        if (!q) {
            return state.reports;
        }
        return state.reports.filter(function (report) {
            var resident = getResident(report.residentId);
            var reportText = [
                resident ? resident.name : "",
                report.date,
                report.status,
                report.diet,
                report.sleep,
                report.mood,
                report.activity,
                report.health,
                report.notes
            ].join(" ").toLowerCase();
            return reportText.indexOf(q) > -1;
        });
    }

    function applyCommandSearch(value) {
        var q = value.trim().toLowerCase();
        if (!q) {
            return;
        }
        var resident = state.residents.find(function (item) {
            return item.name.toLowerCase().indexOf(q) > -1 || item.room.toLowerCase().indexOf(q) > -1;
        });
        if (resident) {
            state.selectedResidentId = resident.id;
            saveState();
            navigateToView("residents");
            return;
        }
        var nav = Array.prototype.find.call(document.querySelectorAll("[data-page-link]"), function (link) {
            return link.textContent.toLowerCase().indexOf(q) > -1;
        });
        if (nav) {
            navigateToView(nav.dataset.pageLink);
        }
    }

    function openResidentModal(resident) {
        document.getElementById("residentForm").reset();
        document.getElementById("residentIdField").value = resident ? resident.id : "";
        document.getElementById("residentModalTitle").textContent = resident ? "Edit Resident" : "Add Resident";
        if (resident) {
            document.getElementById("residentNameField").value = resident.name;
            document.getElementById("residentAgeField").value = resident.age;
            document.getElementById("residentGenderField").value = resident.gender;
            document.getElementById("residentRoomField").value = resident.room;
            document.getElementById("residentBedField").value = resident.bed;
            document.getElementById("residentFloorField").value = resident.floor;
            document.getElementById("residentCareLevelField").value = resident.careLevel;
            document.getElementById("residentFamilyField").value = resident.primaryFamily;
            document.getElementById("residentCaregiverField").value = resident.caregiver;
            document.getElementById("residentTagsField").value = resident.tags.join(", ");
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById("residentModal")).show();
    }

    function openUserModal(user) {
        document.getElementById("userForm").reset();
        document.getElementById("userIdField").value = user ? user.id : "";
        document.getElementById("userModalTitle").textContent = user ? "Edit User" : "Add User";
        if (user) {
            document.getElementById("userNameField").value = user.name;
            document.getElementById("userPhoneField").value = user.phone;
            document.getElementById("userRoleField").value = user.role;
            document.getElementById("userDepartmentField").value = user.department;
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById("userModal")).show();
    }

    function openScheduleModal(schedule) {
        hydrateModalSelects();
        document.getElementById("scheduleForm").reset();
        document.getElementById("scheduleIdField").value = schedule ? schedule.id : "";
        document.getElementById("scheduleModalTitle").textContent = schedule ? "Edit Schedule" : "Create Schedule";
        document.getElementById("scheduleSubmitButton").textContent = schedule ? "Save Schedule" : "Create Schedule";
        if (schedule) {
            document.getElementById("scheduleResidentField").value = schedule.residentId;
            document.getElementById("scheduleTypeField").value = schedule.type;
            document.getElementById("scheduleTitleField").value = schedule.title;
            document.getElementById("scheduleLocationField").value = schedule.location;
            document.getElementById("scheduleStartField").value = schedule.start;
            document.getElementById("scheduleEndField").value = schedule.end;
            document.getElementById("scheduleStaffField").value = schedule.staff;
            document.getElementById("scheduleVisibilityField").value = schedule.visibility;
            document.getElementById("scheduleRepeatField").value = schedule.repeat;
        } else {
            document.getElementById("scheduleResidentField").value = state.selectedResidentId;
            var resident = getResident(state.selectedResidentId);
            document.getElementById("scheduleStaffField").value = resident ? resident.caregiver : "";
            document.getElementById("scheduleStartField").value = "2026-06-08T09:00";
            document.getElementById("scheduleEndField").value = "2026-06-08T09:30";
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById("scheduleModal")).show();
    }

    function openAppointmentModal() {
        hydrateModalSelects();
        document.getElementById("appointmentForm").reset();
        document.getElementById("appointmentResidentField").value = state.selectedResidentId;
        document.getElementById("appointmentTimeField").value = "2026-06-08T15:00";
        bootstrap.Modal.getOrCreateInstance(document.getElementById("appointmentModal")).show();
    }

    function openInquiryModal() {
        hydrateModalSelects();
        document.getElementById("inquiryForm").reset();
        document.getElementById("inquiryResidentField").value = state.selectedResidentId;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("inquiryModal")).show();
    }

    function saveResidentForm() {
        var id = document.getElementById("residentIdField").value || nextId("r", state.residents);
        var existing = getResident(id);
        var payload = {
            id: id,
            name: valueOf("residentNameField"),
            gender: valueOf("residentGenderField"),
            age: Number(valueOf("residentAgeField")),
            room: valueOf("residentRoomField"),
            bed: valueOf("residentBedField"),
            floor: valueOf("residentFloorField"),
            careLevel: valueOf("residentCareLevelField"),
            tags: splitTags(valueOf("residentTagsField")),
            status: existing ? existing.status : "Active",
            admissionDate: existing ? existing.admissionDate : today,
            primaryFamily: valueOf("residentFamilyField"),
            emergencyContact: valueOf("residentFamilyField"),
            caregiver: valueOf("residentCaregiverField"),
            nurse: existing ? existing.nurse : "David Lee",
            supervisor: existing ? existing.supervisor : "Grace Turner",
            activityStaff: existing ? existing.activityStaff : "Liu Fang",
            tone: existing ? existing.tone : "tone-violet"
        };
        if (existing) {
            Object.assign(existing, payload);
            addAudit("Edited resident profile", payload.name);
        } else {
            state.residents.push(payload);
            addAudit("Created resident profile", payload.name);
        }
        state.selectedResidentId = id;
        saveState();
        bootstrap.Modal.getInstance(document.getElementById("residentModal")).hide();
        render();
        toast("Resident profile saved.");
    }

    function saveUserForm() {
        var id = document.getElementById("userIdField").value || nextId("u", state.users);
        var existing = getUser(id);
        var payload = {
            id: id,
            name: valueOf("userNameField"),
            phone: valueOf("userPhoneField"),
            role: valueOf("userRoleField"),
            department: valueOf("userDepartmentField") || "CareBridge",
            status: existing ? existing.status : "Active",
            residents: existing ? existing.residents : [state.selectedResidentId]
        };
        if (existing) {
            Object.assign(existing, payload);
            addAudit("Edited user account", payload.name);
        } else {
            state.users.push(payload);
            addAudit("Created user account", payload.name);
        }
        saveState();
        bootstrap.Modal.getInstance(document.getElementById("userModal")).hide();
        render();
        toast("User account saved.");
    }

    function saveScheduleForm() {
        var id = document.getElementById("scheduleIdField").value || nextId("s", state.schedules);
        var existing = getSchedule(id);
        var residentId = valueOf("scheduleResidentField");
        var schedule = {
            id: id,
            residentId: residentId,
            title: valueOf("scheduleTitleField"),
            type: valueOf("scheduleTypeField"),
            start: valueOf("scheduleStartField"),
            end: valueOf("scheduleEndField"),
            location: valueOf("scheduleLocationField"),
            staff: valueOf("scheduleStaffField"),
            visibility: valueOf("scheduleVisibilityField"),
            repeat: valueOf("scheduleRepeatField"),
            status: existing ? existing.status : "Planned"
        };
        if (existing) {
            Object.assign(existing, schedule);
            addAudit("Edited schedule", schedule.title);
        } else {
            state.schedules.push(schedule);
            addAudit("Created schedule", schedule.title);
        }
        state.selectedResidentId = residentId;
        saveState();
        bootstrap.Modal.getInstance(document.getElementById("scheduleModal")).hide();
        render();
        toast(existing ? "Schedule saved." : "Schedule created.");
    }

    function saveAppointmentForm() {
        var residentId = valueOf("appointmentResidentField");
        var appointment = {
            id: nextId("a", state.appointments),
            residentId: residentId,
            type: valueOf("appointmentTypeField"),
            family: getResident(residentId).primaryFamily,
            time: valueOf("appointmentTimeField"),
            purpose: valueOf("appointmentPurposeField"),
            status: "Pending"
        };
        state.appointments.push(appointment);
        state.selectedResidentId = residentId;
        addAudit("Created appointment request", appointment.type + " for " + getResident(residentId).name);
        saveState();
        bootstrap.Modal.getInstance(document.getElementById("appointmentModal")).hide();
        render();
        toast("Appointment request submitted.");
    }

    function saveInquiryForm() {
        var residentId = valueOf("inquiryResidentField");
        var resident = getResident(residentId);
        var conversationId = nextId("c", state.conversations);
        var inquiryId = nextId("i", state.inquiries);
        var title = valueOf("inquiryTitleField");
        var description = valueOf("inquiryDescriptionField");
        state.conversations.push({
            id: conversationId,
            residentId: residentId,
            type: "Service inquiry",
            title: title,
            status: "pending_reply",
            unread: 1,
            messages: [
                { sender: resident.primaryFamily, role: "Family", content: description, time: new Date().toISOString(), outgoing: false }
            ]
        });
        state.inquiries.push({
            id: inquiryId,
            conversationId: conversationId,
            residentId: residentId,
            title: title,
            description: description,
            createdBy: resident.primaryFamily,
            assignedTo: resident.caregiver,
            status: "Pending",
            priority: "Normal",
            createdAt: new Date().toISOString()
        });
        state.activeConversationId = conversationId;
        state.selectedResidentId = residentId;
        addAudit("Created service inquiry", title);
        saveState();
        bootstrap.Modal.getInstance(document.getElementById("inquiryModal")).hide();
        navigateToView("conversationDetail");
        toast("Service inquiry created.");
    }

    function sendMessage() {
        var input = document.getElementById("messageInput");
        var conversation = getConversation(state.activeConversationId);
        if (!conversation || !input.value.trim()) {
            return;
        }
        var sender = state.role === "Family" ? getResident(conversation.residentId).primaryFamily : "Grace Turner";
        conversation.messages.push({
            sender: sender,
            role: state.role,
            content: input.value.trim(),
            time: new Date().toISOString(),
            outgoing: state.role !== "Family"
        });
        conversation.status = state.role === "Family" ? "pending_reply" : "active";
        var inquiry = state.inquiries.find(function (item) {
            return item.conversationId === conversation.id;
        });
        if (inquiry && state.role !== "Family" && inquiry.status !== "Closed") {
            inquiry.status = "Replied";
        }
        input.value = "";
        saveState();
        render();
        toast("Message sent.");
    }

    function submitCareRecord() {
        var residentId = valueOf("careResidentField");
        var resident = getResident(residentId);
        var record = {
            id: nextId("cr", state.careRecords),
            residentId: residentId,
            caregiver: resident.caregiver,
            date: valueOf("careDateField"),
            meal: valueOf("mealField"),
            sleep: valueOf("sleepField"),
            mood: valueOf("moodField"),
            activity: valueOf("activityField"),
            hygiene: valueOf("hygieneField"),
            mobility: valueOf("mobilityField"),
            notes: valueOf("careNotesField"),
            visible: document.getElementById("careVisibleField").checked
        };
        state.careRecords = state.careRecords.filter(function (item) {
            return !(item.residentId === residentId && item.date === record.date);
        });
        state.careRecords.push(record);
        state.selectedResidentId = residentId;
        addAudit("Submitted care record", resident.name);
        saveState();
        render();
        toast("Care record submitted.");
    }

    function submitHealthObservation() {
        var residentId = valueOf("healthResidentField");
        var resident = getResident(residentId);
        var observation = {
            id: nextId("ho", state.observations),
            residentId: residentId,
            nurse: resident.nurse,
            time: valueOf("healthTimeField"),
            bloodPressure: valueOf("bloodPressureField"),
            heartRate: Number(valueOf("heartRateField")),
            temperature: valueOf("temperatureField"),
            bloodSugar: valueOf("bloodSugarField"),
            medication: valueOf("medicationField"),
            notes: valueOf("medicalNotesField"),
            visible: true
        };
        state.observations.push(observation);
        state.selectedResidentId = residentId;
        addAudit("Created health observation", resident.name);
        saveState();
        render();
        toast("Health observation submitted.");
    }

    function reviewAppointment(id, status) {
        var appointment = state.appointments.find(function (item) {
            return item.id === id;
        });
        if (!appointment) {
            return;
        }
        appointment.status = status;
        if (status === "Approved") {
            var resident = getResident(appointment.residentId);
            state.schedules.push({
                id: nextId("s", state.schedules),
                residentId: appointment.residentId,
                title: appointment.type + " with " + appointment.family,
                type: appointment.type === "Visit" ? "Family visit appointment" : "Video call appointment",
                start: appointment.time,
                end: addMinutes(appointment.time, 30),
                location: appointment.type === "Visit" ? "Family Visit Room" : "Family Booth",
                staff: resident.caregiver,
                visibility: "all_visible",
                repeat: "One-time",
                status: "Approved"
            });
        }
        addAudit(status + " appointment", appointment.type);
        saveState();
        render();
        toast("Appointment " + status.toLowerCase() + ".");
    }

    function completeSchedule(id) {
        var schedule = state.schedules.find(function (item) {
            return item.id === id;
        });
        if (!schedule) {
            return;
        }
        schedule.status = "Completed";
        addAudit("Completed schedule", schedule.title);
        saveState();
        render();
        toast("Schedule marked completed.");
    }

    function setInquiryStatus(id, status) {
        var inquiry = state.inquiries.find(function (item) {
            return item.id === id;
        });
        if (!inquiry) {
            return;
        }
        inquiry.status = status;
        var conversation = getConversation(inquiry.conversationId);
        if (conversation) {
            conversation.status = status === "Closed" ? "closed" : status.toLowerCase().replace(/\s+/g, "_");
        }
        addAudit("Updated inquiry status", inquiry.title + " to " + status);
        saveState();
        render();
        toast("Inquiry status updated.");
    }

    function generateReport(residentId) {
        var resident = getResident(residentId);
        if (!resident) {
            return;
        }
        var record = state.careRecords.filter(function (item) {
            return item.residentId === residentId;
        }).slice(-1)[0];
        var observation = state.observations.filter(function (item) {
            return item.residentId === residentId;
        }).slice(-1)[0];
        if (!record) {
            toast("Submit a care record before generating a report.");
            return;
        }
        var existing = state.reports.find(function (item) {
            return item.residentId === residentId && item.date === record.date;
        });
        var report = {
            id: existing ? existing.id : nextId("dr", state.reports),
            residentId: residentId,
            date: record.date,
            diet: "Meal status was recorded as " + record.meal.toLowerCase() + ".",
            sleep: "Sleep status was recorded as " + record.sleep.toLowerCase() + ".",
            mood: "Mood was " + record.mood.toLowerCase() + ".",
            activity: "Activity participation: " + record.activity.toLowerCase() + ".",
            health: observation ? "Blood pressure was " + observation.bloodPressure + ", heart rate " + observation.heartRate + ", medication status " + observation.medication.toLowerCase() + "." : "No visible health observation has been submitted yet.",
            notes: record.visible ? record.notes : "Care notes are staff-only for this report.",
            status: "Generated"
        };
        if (existing) {
            Object.assign(existing, report);
        } else {
            state.reports.push(report);
        }
        state.selectedReportId = report.id;
        addAudit("Generated daily report", resident.name);
        saveState();
        navigateToView("reports");
        toast("Daily report generated.");
    }

    function createInquiryFromReport() {
        var report = getReport(state.selectedReportId);
        if (!report) {
            return;
        }
        var resident = getResident(report.residentId);
        var conversationId = nextId("c", state.conversations);
        var inquiryId = nextId("i", state.inquiries);
        var title = "Question about " + report.date + " daily report";
        state.conversations.push({
            id: conversationId,
            residentId: resident.id,
            type: "Service inquiry",
            title: title,
            status: "pending_reply",
            unread: 1,
            messages: [
                { sender: resident.primaryFamily, role: "Family", content: "I have a question about today's daily status report.", time: new Date().toISOString(), outgoing: false }
            ]
        });
        state.inquiries.push({
            id: inquiryId,
            conversationId: conversationId,
            residentId: resident.id,
            title: title,
            description: "Family created this inquiry from the daily report page.",
            createdBy: resident.primaryFamily,
            assignedTo: resident.caregiver,
            status: "Pending",
            priority: "Normal",
            createdAt: new Date().toISOString()
        });
        state.activeConversationId = conversationId;
        addAudit("Created inquiry from report", resident.name);
        saveState();
        navigateToView("conversationDetail");
        toast("Inquiry created from report.");
    }

    function deleteResident(id) {
        var resident = getResident(id);
        if (!resident) {
            return;
        }
        if (state.residents.length <= 1) {
            toast("At least one resident is required for the demo.");
            return;
        }
        if (!confirmAction("Delete this resident profile and related demo records?")) {
            return;
        }
        state.users.forEach(function (user) {
            user.residents = user.residents.filter(function (residentId) {
                return residentId !== id;
            });
        });
        state.schedules = state.schedules.filter(function (item) { return item.residentId !== id; });
        state.appointments = state.appointments.filter(function (item) { return item.residentId !== id; });
        state.careRecords = state.careRecords.filter(function (item) { return item.residentId !== id; });
        state.observations = state.observations.filter(function (item) { return item.residentId !== id; });
        state.reports = state.reports.filter(function (item) { return item.residentId !== id; });
        state.conversations = state.conversations.filter(function (item) { return item.residentId !== id; });
        state.inquiries = state.inquiries.filter(function (item) { return item.residentId !== id; });
        state.residents = state.residents.filter(function (item) { return item.id !== id; });
        state.selectedResidentId = state.residents[0].id;
        state.activeConversationId = state.conversations[0] ? state.conversations[0].id : "";
        state.selectedReportId = state.reports[0] ? state.reports[0].id : "";
        addAudit("Deleted resident profile", resident.name);
        saveState();
        render();
        toast("Resident profile deleted.");
    }

    function deleteUser(id) {
        var user = getUser(id);
        if (!user) {
            return;
        }
        if (state.users.length <= 1) {
            toast("At least one account is required for the demo.");
            return;
        }
        if (!confirmAction("Delete this account record?")) {
            return;
        }
        state.users = state.users.filter(function (item) {
            return item.id !== id;
        });
        addAudit("Deleted user account", user.name);
        saveState();
        render();
        toast("User account deleted.");
    }

    function cancelSchedule(id) {
        var schedule = getSchedule(id);
        if (!schedule) {
            return;
        }
        if (!confirmAction("Cancel and remove this schedule record?")) {
            return;
        }
        state.schedules = state.schedules.filter(function (item) {
            return item.id !== id;
        });
        addAudit("Cancelled schedule", schedule.title);
        saveState();
        render();
        toast("Schedule cancelled.");
    }

    function deleteAppointment(id) {
        var appointment = state.appointments.find(function (item) {
            return item.id === id;
        });
        if (!appointment) {
            return;
        }
        if (!confirmAction("Delete this appointment request?")) {
            return;
        }
        state.appointments = state.appointments.filter(function (item) {
            return item.id !== id;
        });
        addAudit("Deleted appointment request", appointment.type);
        saveState();
        render();
        toast("Appointment request deleted.");
    }

    function archiveConversation(id) {
        var conversation = getConversation(id);
        if (!conversation) {
            return;
        }
        conversation.status = "archived";
        conversation.unread = 0;
        addAudit("Archived conversation", conversation.title);
        saveState();
        render();
        toast("Conversation archived.");
    }

    function deleteInquiry(id) {
        var inquiry = state.inquiries.find(function (item) {
            return item.id === id;
        });
        if (!inquiry) {
            return;
        }
        if (!confirmAction("Delete this service inquiry and its conversation?")) {
            return;
        }
        state.inquiries = state.inquiries.filter(function (item) {
            return item.id !== id;
        });
        state.conversations = state.conversations.filter(function (item) {
            return item.id !== inquiry.conversationId;
        });
        state.activeConversationId = state.conversations[0] ? state.conversations[0].id : "";
        addAudit("Deleted service inquiry", inquiry.title);
        saveState();
        render();
        toast("Service inquiry deleted.");
    }

    function deleteCareRecord(id) {
        var record = state.careRecords.find(function (item) {
            return item.id === id;
        });
        if (!record) {
            return;
        }
        var resident = getResident(record.residentId);
        if (!confirmAction("Delete this care record?")) {
            return;
        }
        state.careRecords = state.careRecords.filter(function (item) {
            return item.id !== id;
        });
        addAudit("Deleted care record", resident ? resident.name : record.id);
        saveState();
        render();
        toast("Care record deleted.");
    }

    function reviewReport(id) {
        var report = getReport(id);
        if (!report) {
            return;
        }
        var resident = getResident(report.residentId);
        report.status = "Reviewed";
        addAudit("Reviewed daily report", resident ? resident.name : report.id);
        saveState();
        render();
        toast("Daily report marked reviewed.");
    }

    function deleteReport(id) {
        var report = getReport(id);
        if (!report) {
            return;
        }
        var resident = getResident(report.residentId);
        if (!confirmAction("Delete this daily report?")) {
            return;
        }
        state.reports = state.reports.filter(function (item) {
            return item.id !== id;
        });
        state.selectedReportId = state.reports[0] ? state.reports[0].id : "";
        addAudit("Deleted daily report", resident ? resident.name : report.id);
        saveState();
        render();
        toast("Daily report deleted.");
    }

    function toggleUserStatus(id) {
        var user = getUser(id);
        if (!user) {
            return;
        }
        user.status = user.status === "Active" ? "Frozen" : "Active";
        addAudit(user.status === "Active" ? "Activated account" : "Froze account", user.name);
        saveState();
        render();
        toast("User status updated.");
    }

    function resetDemo() {
        localStorage.removeItem(STORAGE_KEY);
        state = clone(defaultState);
        render();
        toast("Demo data reset.");
    }

    function hydrateModalSelects() {
        ["scheduleResidentField", "appointmentResidentField", "inquiryResidentField"].forEach(function (id) {
            var element = document.getElementById(id);
            if (element) {
                element.innerHTML = residentOptions(element.value || state.selectedResidentId);
            }
        });
    }

    function residentOptions(selectedId) {
        return state.residents.map(function (resident) {
            return '<option value="' + resident.id + '"' + (resident.id === selectedId ? " selected" : "") + ">" + escapeHtml(resident.name + " - " + resident.room) + "</option>";
        }).join("");
    }

    function option(value, selected) {
        return '<option' + (value === selected ? " selected" : "") + ">" + escapeHtml(value) + "</option>";
    }

    function getResident(id) {
        return state.residents.find(function (resident) {
            return resident.id === id;
        });
    }

    function getUser(id) {
        return state.users.find(function (user) {
            return user.id === id;
        });
    }

    function getConversation(id) {
        return state.conversations.find(function (conversation) {
            return conversation.id === id;
        });
    }

    function getSchedule(id) {
        return state.schedules.find(function (schedule) {
            return schedule.id === id;
        });
    }

    function markConversationRead(id) {
        var conversation = getConversation(id);
        if (conversation) {
            conversation.unread = 0;
        }
    }

    function getReport(id) {
        return state.reports.find(function (report) {
            return report.id === id;
        });
    }

    function latestReport(residentId) {
        return state.reports.filter(function (report) {
            return report.residentId === residentId;
        }).slice(-1)[0];
    }

    function openInquiries() {
        return state.inquiries.filter(function (item) {
            return item.status !== "Closed";
        });
    }

    function pendingAppointmentCount() {
        return state.appointments.filter(function (item) {
            return item.status === "Pending";
        }).length;
    }

    function unreadConversationCount() {
        return state.conversations.reduce(function (total, conversation) {
            return total + Number(conversation.unread || 0);
        }, 0);
    }

    function dashboardWorkloadCount() {
        return openInquiries().length + pendingAppointmentCount() + missingRecordCount();
    }

    function missingRecordCount() {
        return state.residents.filter(function (resident) {
            return !hasCareRecord(resident.id);
        }).length;
    }

    function hasCareRecord(residentId) {
        return state.careRecords.some(function (record) {
            return record.residentId === residentId && record.date === today;
        });
    }

    function completedRecordCount() {
        return state.residents.filter(function (resident) {
            return hasCareRecord(resident.id);
        }).length;
    }

    function completionRate() {
        if (!state.residents.length) {
            return 0;
        }
        return Math.round(completedRecordCount() / state.residents.length * 100);
    }

    function activeStaffCount() {
        return state.users.filter(function (user) {
            return user.status === "Active" && user.role !== "Family Member" && user.role !== "Elderly Resident";
        }).length;
    }

    function countFrozenAccounts() {
        return state.users.filter(function (user) {
            return user.status === "Frozen";
        }).length;
    }

    function completedScheduleCount() {
        return state.schedules.filter(function (schedule) {
            return schedule.status === "Completed";
        }).length;
    }

    function valueOf(id) {
        var element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    function splitTags(value) {
        return value.split(",").map(function (tag) {
            return tag.trim();
        }).filter(Boolean);
    }

    function nextId(prefix, collection) {
        var max = collection.reduce(function (highest, item) {
            var number = Number(String(item.id).replace(prefix, ""));
            return Number.isFinite(number) ? Math.max(highest, number) : highest;
        }, 0);
        return prefix + (max + 1);
    }

    function addAudit(action, target) {
        state.auditLogs.unshift({
            id: nextId("log", state.auditLogs),
            actor: state.role === "Family" ? "Olivia Chen" : "Grace Turner",
            action: action,
            target: target,
            time: new Date().toISOString()
        });
    }

    function confirmAction(message) {
        return window.confirm(message);
    }

    function addMinutes(iso, minutes) {
        var date = new Date(iso);
        date.setMinutes(date.getMinutes() + minutes);
        return toLocalInputValue(date);
    }

    function toLocalInputValue(date) {
        var pad = function (value) {
            return String(value).padStart(2, "0");
        };
        return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
    }

    function formatDateTime(iso) {
        if (!iso) {
            return "-";
        }
        return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }

    function formatTime(iso) {
        if (!iso) {
            return "-";
        }
        return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }

    function formatStatus(status) {
        return String(status || "").replace(/_/g, " ").replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
    }

    function statusBadge(status) {
        if (status === "closed") {
            return "badge-teal";
        }
        if (status === "pending_reply") {
            return "badge-amber";
        }
        if (status === "supervisor_review") {
            return "badge-violet";
        }
        return "badge-soft";
    }

    function inquiryBadge(status) {
        if (status === "Closed" || status === "Replied") {
            return "badge-teal";
        }
        if (status === "Supervisor Review") {
            return "badge-violet";
        }
        if (status === "Pending") {
            return "badge-amber";
        }
        return "badge-soft";
    }

    function scheduleBadge(status) {
        if (status === "Completed" || status === "Approved") {
            return "badge-teal";
        }
        if (status === "Rejected") {
            return "badge-red";
        }
        if (status === "Pending") {
            return "badge-amber";
        }
        return "badge-soft";
    }

    function initials(name) {
        return String(name || "")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(function (part) {
                return part.charAt(0).toUpperCase();
            })
            .join("");
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function scrollMessagesToBottom() {
        requestAnimationFrame(function () {
            var messages = document.getElementById("messages");
            if (messages) {
                messages.scrollTop = messages.scrollHeight;
            }
        });
    }

    function toast(message) {
        var toastEl = document.getElementById("appToast");
        document.getElementById("toastBody").textContent = message;
        bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2200 }).show();
    }
})();
