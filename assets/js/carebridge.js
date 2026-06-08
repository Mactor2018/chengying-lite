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
        scheduleType: "All types"
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
                markConversationRead(conversation.id);
                state.selectedResidentId = conversation.residentId;
            }
            state.view = "conversations";
            saveState();
            render();
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
        } else if (action === "new-user") {
            openUserModal();
        } else if (action === "edit-user") {
            openUserModal(getUser(actionButton.dataset.userId));
        } else if (action === "toggle-user") {
            toggleUserStatus(actionButton.dataset.userId);
        } else if (action === "new-schedule") {
            openScheduleModal();
        } else if (action === "book-appointment") {
            openAppointmentModal();
        } else if (action === "new-inquiry") {
            openInquiryModal();
        } else if (action === "approve-appointment" || action === "reject-appointment") {
            reviewAppointment(actionButton.dataset.appointmentId, action === "approve-appointment" ? "Approved" : "Rejected");
        } else if (action === "complete-schedule") {
            completeSchedule(actionButton.dataset.scheduleId);
        } else if (action === "set-inquiry-status") {
            setInquiryStatus(actionButton.dataset.inquiryId, actionButton.dataset.status);
        } else if (action === "generate-report") {
            generateReport(state.selectedResidentId);
        } else if (action === "ask-report") {
            createInquiryFromReport();
        } else if (action === "switch-view") {
            state.view = actionButton.dataset.targetView;
            saveState();
            render();
        } else if (action === "reset-demo") {
            resetDemo();
        } else if (action === "show-audit") {
            state.view = "settings";
            saveState();
            render();
            toast("Audit log is available in Security.");
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
            renderConversations();
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
        document.querySelectorAll("[data-view]").forEach(function (button) {
            button.classList.toggle("active", button.dataset.view === state.view);
        });
        updateNavBadges();
        hydrateModalSelects();

        var viewTitleMap = {
            dashboard: ["Dashboard", "Resident-centered care platform"],
            residents: ["Residents", "Personnel & resident profile management"],
            conversations: ["Conversations", "Structured service inquiry and chat"],
            schedule: ["Schedule", "Planned care tasks, visits, and calls"],
            care: ["Care Records", "Actual care outcomes and health observations"],
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
        } else if (state.view === "conversations") {
            renderConversations();
        } else if (state.view === "schedule") {
            renderSchedule();
        } else if (state.view === "care") {
            renderCare();
        } else if (state.view === "reports") {
            renderReports();
        } else if (state.view === "users") {
            renderUsers();
        } else {
            renderSettings();
        }
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

    function renderConversations() {
        var conversations = filteredConversations();
        setListPane(
            "Conversation Home",
            "Search conversations and service inquiries",
            '<div class="toolbar-line">' +
            '<input class="form-control" id="conversationSearch" type="search" placeholder="Search resident, title, message" value="' + escapeHtml(filters.conversationSearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-inquiry" aria-label="Create inquiry"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<div class="entity-list">' + conversations.map(renderConversationRow).join("") + "</div>"
        );

        var conversation = getConversation(state.activeConversationId) || state.conversations[0];
        if (!conversation) {
            document.getElementById("detailPane").innerHTML = emptyState("No conversations yet", "Create a service inquiry to start a resident communication space.");
            return;
        }
        state.activeConversationId = conversation.id;
        markConversationRead(conversation.id);
        updateNavBadges();
        var resident = getResident(conversation.residentId);
        var inquiry = state.inquiries.find(function (item) {
            return item.conversationId === conversation.id;
        });

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
            "</aside>" +
            "</div>";
        scrollMessagesToBottom();
    }

    function renderSchedule() {
        var type = filters.scheduleType;
        var schedules = state.schedules.filter(function (item) {
            return type === "All types" || item.type === type;
        }).sort(function (a, b) {
            return new Date(a.start) - new Date(b.start);
        });
        var appointmentList = state.appointments.map(renderAppointmentRow).join("");
        setListPane(
            "Schedule Filters",
            "Plan first, record outcome later",
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
            '<button class="btn btn-light" type="button" data-action="book-appointment"><i class="fa fa-video-camera me-2" aria-hidden="true"></i>Book Appointment</button>' +
            "</div>" +
            '<div class="section-title"><h2>Appointment Requests</h2></div>' +
            '<div class="entity-list">' + appointmentList + "</div>"
        );

        var resident = getResident(state.selectedResidentId);
        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Staff Calendar</p><h2>June 8 Schedule Board</h2></div><span class="badge badge-soft">Visibility aware</span></div>' +
            '<div class="timeline mb-4">' + schedules.map(renderTimelineItem).join("") + "</div>" +
            '<div class="row g-3">' +
            '<div class="col-xl-6">' + renderElderlyTodayPanel(resident) + "</div>" +
            '<div class="col-xl-6">' + renderAppointmentWorkflow() + "</div>" +
            "</div>";
    }

    function renderCare() {
        var completionRows = state.residents.map(function (resident) {
            var complete = hasCareRecord(resident.id);
            return '<div class="completion-row"><div><strong>' + escapeHtml(resident.name) + '</strong><div class="entity-subtitle">' + escapeHtml(resident.room + " - " + resident.caregiver) + '</div></div><span class="badge ' + (complete ? "badge-teal" : "badge-amber") + '">' + (complete ? "Completed" : "Missing") + "</span></div>";
        }).join("");
        setListPane(
            "Record Completion",
            "Supervisor view for today",
            '<div class="soft-panel mb-3"><div class="section-title"><h2>' + completionRate() + '% completed</h2><span class="badge badge-soft">Jun 8</span></div><div class="progress"><div class="progress-bar" style="width:' + completionRate() + '%"></div></div></div>' +
            completionRows
        );

        document.getElementById("detailPane").innerHTML =
            '<ul class="nav nav-tabs mb-3" role="tablist">' +
            '<li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#careRecordTab" type="button" role="tab">Daily Care Record</button></li>' +
            '<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#healthTab" type="button" role="tab">Health Observation</button></li>' +
            '<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#reviewTab" type="button" role="tab">Supervisor Review</button></li>' +
            "</ul>" +
            '<div class="tab-content">' +
            '<div class="tab-pane fade show active" id="careRecordTab" role="tabpanel">' + renderCareRecordForm() + "</div>" +
            '<div class="tab-pane fade" id="healthTab" role="tabpanel">' + renderHealthObservationForm() + "</div>" +
            '<div class="tab-pane fade" id="reviewTab" role="tabpanel">' + renderSupervisorReview() + "</div>" +
            "</div>";
    }

    function renderReports() {
        if (!getReport(state.selectedReportId) && state.reports.length) {
            state.selectedReportId = state.reports[0].id;
        }
        setListPane(
            "Family Daily Reports",
            "Simplified status summaries",
            '<div class="d-grid mb-3"><button class="btn btn-primary" type="button" data-action="generate-report"><i class="fa fa-refresh me-2" aria-hidden="true"></i>Generate Selected Report</button></div>' +
            '<div class="entity-list">' + state.reports.map(renderReportRow).join("") + "</div>"
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
            '<div class="trend-grid">' +
            renderTrendCard("7-day meal status", [["Normal", 78, "teal"], ["Ate less", 18, "amber"], ["Refused", 4, "violet"]]) +
            renderTrendCard("7-day sleep quality", [["Good", 62, "teal"], ["Average", 30, "primary"], ["Interrupted", 8, "amber"]]) +
            renderTrendCard("30-day activity count", [["Joined", 72, "primary"], ["Partial", 20, "violet"], ["Absent", 8, "amber"]]) +
            renderTrendCard("Mood distribution", [["Stable", 70, "teal"], ["Happy", 16, "primary"], ["Anxious", 14, "amber"]]) +
            "</div>";
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
                return '<tr><td><strong>' + escapeHtml(user.name) + '</strong><div class="entity-subtitle">' + escapeHtml(user.phone) + '</div></td><td>' + escapeHtml(user.role) + '</td><td>' + escapeHtml(user.department || "-") + '</td><td>' + user.residents.length + '</td><td><span class="badge ' + (user.status === "Active" ? "badge-teal" : "badge-amber") + '">' + user.status + '</span></td><td><div class="btn-group btn-group-sm"><button class="btn btn-light" type="button" data-action="edit-user" data-user-id="' + user.id + '">Edit</button><button class="btn btn-light" type="button" data-action="toggle-user" data-user-id="' + user.id + '">' + (user.status === "Active" ? "Freeze" : "Activate") + "</button></div></td></tr>";
            }).join("") +
            "</tbody></table></div>";
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

    function renderResidentHero(resident) {
        return '<div class="profile-heading">' +
            '<div class="profile-heading-main">' +
            '<div class="avatar resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="min-w-0"><p class="eyebrow mb-1">Resident Profile</p><h2>' + escapeHtml(resident.name) + '</h2><div class="entity-subtitle">' + escapeHtml(resident.room + " - " + resident.careLevel) + '</div></div>' +
            "</div>" +
            '<div class="d-flex flex-wrap gap-2 justify-content-end">' +
            '<button class="btn btn-light btn-sm" type="button" data-action="edit-resident"><i class="fa fa-pencil me-1" aria-hidden="true"></i>Edit</button>' +
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
        return '<div class="row g-3">' +
            '<div class="col-lg-4">' + metricPanel("Total residents", state.residents.length, "fa-id-card-o") + "</div>" +
            '<div class="col-lg-4">' + metricPanel("Completed records", completedRecordCount(), "fa-check-circle-o") + "</div>" +
            '<div class="col-lg-4">' + metricPanel("Special notes", special.length, "fa-exclamation-circle") + "</div>" +
            '<div class="col-12"><div class="table-wrap"><table class="table align-middle"><thead><tr><th>Resident</th><th>Caregiver</th><th>Meal</th><th>Mood</th><th>Mobility</th><th>Visibility</th></tr></thead><tbody>' +
            state.careRecords.map(function (record) {
                var resident = getResident(record.residentId);
                return '<tr><td>' + escapeHtml(resident.name) + '</td><td>' + escapeHtml(record.caregiver) + '</td><td>' + escapeHtml(record.meal) + '</td><td>' + escapeHtml(record.mood) + '</td><td>' + escapeHtml(record.mobility) + '</td><td><span class="badge ' + (record.visible ? "badge-teal" : "badge-amber") + '">' + (record.visible ? "Family visible" : "Staff only") + "</span></td></tr>";
            }).join("") +
            "</tbody></table></div></div></div>";
    }

    function renderReportDetail(report, resident) {
        return '<div class="profile-heading">' +
            '<div class="profile-heading-main"><div class="avatar resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div><div><p class="eyebrow mb-1">Daily Status Report</p><h2>' + escapeHtml(resident.name) + '</h2><div class="entity-subtitle">' + escapeHtml(report.date) + ' - ' + escapeHtml(report.status) + '</div></div></div>' +
            '<div class="d-flex gap-2"><button class="btn btn-light" type="button" data-action="ask-report"><i class="fa fa-question-circle me-1" aria-hidden="true"></i>Ask about report</button><button class="btn btn-primary" type="button" data-action="generate-report">Regenerate</button></div>' +
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

    function renderTimelineItem(item) {
        var resident = getResident(item.residentId);
        return '<div class="timeline-item">' +
            '<div class="timeline-time">' + formatTime(item.start) + '</div>' +
            '<div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(resident.name + " - " + item.location + " - " + item.staff) + '</p></div>' +
            '<div class="d-flex align-items-center gap-2 flex-wrap justify-content-end"><span class="badge ' + scheduleBadge(item.status) + '">' + escapeHtml(item.status) + '</span>' +
            (item.status === "Planned" ? '<button class="btn btn-sm btn-light" type="button" data-action="complete-schedule" data-schedule-id="' + item.id + '">Complete</button>' : "") +
            "</div></div>";
    }

    function renderAppointmentRow(item) {
        var resident = getResident(item.residentId);
        return '<div class="entity-row">' +
            '<div class="avatar avatar-small resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="entity-body"><div class="entity-title">' + escapeHtml(item.type) + '</div><div class="entity-subtitle">' + escapeHtml(resident.name + " - " + formatDateTime(item.time)) + '</div><div class="entity-meta">' + escapeHtml(item.family + ": " + item.purpose) + '</div></div>' +
            '<div class="d-flex flex-column gap-1 align-items-end"><span class="badge ' + scheduleBadge(item.status) + '">' + escapeHtml(item.status) + '</span>' +
            (item.status === "Pending" ? '<div class="btn-group btn-group-sm"><button class="btn btn-light" type="button" data-action="approve-appointment" data-appointment-id="' + item.id + '">Approve</button><button class="btn btn-light" type="button" data-action="reject-appointment" data-appointment-id="' + item.id + '">Reject</button></div>' : "") +
            "</div></div>";
    }

    function renderRecordList(records) {
        if (!records.length) {
            return emptyState("No care record", "Submit the first daily care record for this resident.");
        }
        return '<div class="entity-list">' + records.map(function (record) {
            return '<div class="entity-row"><div class="avatar avatar-small tone-teal"><i class="fa fa-heartbeat" aria-hidden="true"></i></div><div class="entity-body"><div class="entity-title">' + escapeHtml(record.date + " - " + record.mood) + '</div><div class="entity-subtitle">' + escapeHtml(record.meal + ", " + record.sleep + ", " + record.mobility) + '</div><div class="entity-meta">' + escapeHtml(record.notes) + '</div></div><span class="badge ' + (record.visible ? "badge-teal" : "badge-amber") + '">' + (record.visible ? "Visible" : "Staff only") + "</span></div>";
        }).join("") + "</div>";
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

    function appInfoCard(title, copy, icon) {
        return '<div class="app-card"><div class="card-icon"><i class="fa ' + icon + '" aria-hidden="true"></i></div><h3>' + escapeHtml(title) + '</h3><p class="mb-0">' + escapeHtml(copy) + "</p></div>";
    }

    function infoCell(label, value) {
        return '<div class="info-cell"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || "-") + "</strong></div>";
    }

    function reportBlock(title, value) {
        return '<div class="col-lg-6"><div class="report-block"><h3>' + escapeHtml(title) + '</h3><p class="mb-0 muted-copy">' + escapeHtml(value) + "</p></div></div>";
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
            state.view = "residents";
            saveState();
            render();
            return;
        }
        var nav = Array.prototype.find.call(document.querySelectorAll("[data-view]"), function (button) {
            return button.textContent.toLowerCase().indexOf(q) > -1;
        });
        if (nav) {
            state.view = nav.dataset.view;
            saveState();
            render();
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

    function openScheduleModal() {
        hydrateModalSelects();
        document.getElementById("scheduleForm").reset();
        document.getElementById("scheduleResidentField").value = state.selectedResidentId;
        var resident = getResident(state.selectedResidentId);
        document.getElementById("scheduleStaffField").value = resident ? resident.caregiver : "";
        document.getElementById("scheduleStartField").value = "2026-06-08T09:00";
        document.getElementById("scheduleEndField").value = "2026-06-08T09:30";
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
        var id = nextId("s", state.schedules);
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
            status: "Planned"
        };
        state.schedules.push(schedule);
        state.selectedResidentId = residentId;
        addAudit("Created schedule", schedule.title);
        saveState();
        bootstrap.Modal.getInstance(document.getElementById("scheduleModal")).hide();
        render();
        toast("Schedule created.");
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
        state.view = "conversations";
        addAudit("Created service inquiry", title);
        saveState();
        bootstrap.Modal.getInstance(document.getElementById("inquiryModal")).hide();
        render();
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
        renderConversations();
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
        renderCare();
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
        renderCare();
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
        renderSchedule();
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
        renderSchedule();
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
        renderConversations();
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
        state.view = "reports";
        addAudit("Generated daily report", resident.name);
        saveState();
        render();
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
        state.view = "conversations";
        addAudit("Created inquiry from report", resident.name);
        saveState();
        render();
        toast("Inquiry created from report.");
    }

    function toggleUserStatus(id) {
        var user = getUser(id);
        if (!user) {
            return;
        }
        user.status = user.status === "Active" ? "Frozen" : "Active";
        addAudit(user.status === "Active" ? "Activated account" : "Froze account", user.name);
        saveState();
        renderUsers();
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
