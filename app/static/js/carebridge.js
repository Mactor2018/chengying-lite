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
        dashboard: "/",
        personnel: "/personnel",
        residents: "/residents",
        personnelAnalytics: "/personnel-analytics",
        conversations: "/conversations",
        serviceInquiries: "/service-inquiries",
        conversationDetail: "/conversation-detail",
        schedule: "/schedule",
        appointmentRequests: "/appointment-requests",
        scheduleAnalytics: "/schedule-analytics",
        care: "/care-records",
        healthObservations: "/health-observations",
        reports: "/reports",
        users: "/users",
        settings: "/security"
    };
    var PERSONNEL_VIEWS = ["personnel", "residents", "users", "personnelAnalytics"];
    var FRONTEND_RENDERED_VIEWS = ["dashboard", "settings"].concat(PERSONNEL_VIEWS);
    var personnelApiReady = false;
    var personnelApiError = "";
    var graphDrag = null;
    var graphPan = null;
    var graphPinch = null;
    var graphPointers = {};
    var suppressGraphClick = false;
    var homeVisualFrame = null;
    var GRAPH_BASE_WIDTH = 1280;
    var GRAPH_BASE_HEIGHT = 780;
    var MIN_GRAPH_ZOOM = 0.55;
    var MAX_GRAPH_ZOOM = 2.3;

    var defaultState = {
        view: "dashboard",
        role: "Supervisor",
        selectedResidentId: "r1",
        graphView: "departmentOverview",
        defaultGraphView: "departmentOverview",
        selectedGraphNodeId: "",
        graphZooms: {},
        currentUser: null,
        graphViews: [],
        personnelGraphs: {},
        personnelOptions: {},
        aiInsights: {
            status: "idle",
            summary: "",
            riskLevel: "",
            highlights: [],
            risks: [],
            recommendations: [],
            generatedAt: "",
            model: "",
            source: ""
        },
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

    document.addEventListener("DOMContentLoaded", async function () {
        state.view = currentPage();
        if (state.view === "conversationDetail") {
            markConversationRead(state.activeConversationId);
        }
        startTopbarClock();
        configureCommandSearch();
        bindEvents();
        if (isPersonnelView()) {
            renderPersonnelLoading();
            await syncPersonnelData({ silent: false });
            return;
        }
        if (isFrontendRenderedView()) {
            render();
            if (state.view === "dashboard") {
                syncPersonnelData({ silent: true });
            }
            return;
        }
        syncPageChrome();
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

    function isPersonnelView(view) {
        return PERSONNEL_VIEWS.indexOf(view || state.view) > -1;
    }

    function isFrontendRenderedView(view) {
        return FRONTEND_RENDERED_VIEWS.indexOf(view || state.view) > -1;
    }

    async function syncPersonnelData(options) {
        options = options || {};
        try {
            var data = await apiRequest("/api/personnel/bootstrap");
            applyPersonnelData(data);
            personnelApiReady = true;
            personnelApiError = "";
            saveState();
            render();
        } catch (error) {
            personnelApiReady = false;
            personnelApiError = error.message || "Database unavailable";
            if (isPersonnelView()) {
                renderPersonnelDatabaseError();
            }
            if (!options.silent || isPersonnelView()) {
                toast(personnelApiError);
            }
        }
    }

    function applyPersonnelData(data) {
        var selectedResident = state.selectedResidentId;
        state.residents = normalizeResidents(data.residents || []);
        state.users = normalizeUsers(data.users || []);
        state.currentUser = data.currentUser || null;
        state.graphViews = data.graphViews || [];
        state.personnelGraphs = data.graphs || {};
        state.personnelOptions = data.options || {};
        state.defaultGraphView = data.defaultGraphView || (state.graphViews[0] && state.graphViews[0].key) || "departmentOverview";
        state.graphView = state.personnelGraphs[state.graphView] ? state.graphView : state.defaultGraphView;
        var activeGraph = getActiveGraph();
        if (activeGraph && activeGraph.nodes && activeGraph.nodes.length && !activeGraph.nodes.some(function (node) { return node.id === state.selectedGraphNodeId; })) {
            state.selectedGraphNodeId = activeGraph.nodes[0].id;
        }
        if (!state.residents.some(function (resident) { return resident.id === selectedResident; })) {
            state.selectedResidentId = state.residents[0] ? state.residents[0].id : "";
        }
        syncDemoResidentReferences();
    }

    function normalizeResidents(residents) {
        return residents.map(function (resident) {
            resident.tags = Array.isArray(resident.tags) ? resident.tags : splitTags(resident.tags || "");
            resident.permissions = Object.assign(defaultResidentPermissions(), resident.permissions || {});
            resident.familyBindings = Array.isArray(resident.familyBindings) ? resident.familyBindings : [];
            resident.caregivers = Array.isArray(resident.caregivers) ? resident.caregivers : [];
            resident.activityStaffMembers = Array.isArray(resident.activityStaffMembers) ? resident.activityStaffMembers : [];
            resident.doctors = Array.isArray(resident.doctors) ? resident.doctors : [];
            return resident;
        });
    }

    function normalizeUsers(users) {
        return users.map(function (user) {
            user.residents = Array.isArray(user.residents) ? user.residents : [];
            user.assignments = Array.isArray(user.assignments) ? user.assignments : [];
            user.familyBindings = Array.isArray(user.familyBindings) ? user.familyBindings : [];
            return user;
        });
    }

    function syncDemoResidentReferences() {
        if (!state.residents.length) {
            return;
        }
        var valid = {};
        state.residents.forEach(function (resident) {
            valid[resident.id] = true;
        });
        ["schedules", "appointments", "careRecords", "observations", "reports", "conversations", "inquiries"].forEach(function (key) {
            state[key] = state[key].filter(function (item) {
                return valid[item.residentId];
            });
        });
        if (!valid[state.selectedResidentId]) {
            state.selectedResidentId = state.residents[0].id;
        }
        if (!state.conversations.some(function (item) { return item.id === state.activeConversationId; })) {
            state.activeConversationId = state.conversations[0] ? state.conversations[0].id : "";
        }
        if (!state.reports.some(function (item) { return item.id === state.selectedReportId; })) {
            state.selectedReportId = state.reports[0] ? state.reports[0].id : "";
        }
    }

    async function apiRequest(url, options) {
        options = options || {};
        var headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
        var response = await fetch(url, Object.assign({}, options, { headers: headers }));
        var data = {};
        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }
        if (!response.ok) {
            var message = data.error || "Request failed";
            if (response.status === 503 && !data.error) {
                message = "Personnel records unavailable. Start the database and load database/schema.sql + database/seed.sql.";
            }
            var requestError = new Error(message);
            requestError.status = response.status;
            requestError.data = data;
            throw requestError;
        }
        return data;
    }

    function currentPage() {
        var page = document.body ? document.body.dataset.page : "";
        return PAGE_URLS[page] ? page : "dashboard";
    }

    function configureCommandSearch() {
        var input = document.getElementById("commandSearch");
        if (input) {
            input.placeholder = "Search";
            input.setAttribute("aria-label", "Command search");
        }
    }

    function navigateToView(view) {
        var target = PAGE_URLS[view] || PAGE_URLS.dashboard;
        state.view = PAGE_URLS[view] ? view : "dashboard";
        saveState();
        var currentPath = window.location.pathname || "/";
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
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);
        document.addEventListener("pointercancel", handlePointerUp);
        document.addEventListener("wheel", handleGraphWheel, { passive: false });
        document.addEventListener("keydown", function (event) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                var input = document.getElementById("commandSearch");
                if (input) {
                    input.focus();
                }
                return;
            }
            if (event.target && event.target.id === "commandSearch" && event.key === "Enter") {
                event.preventDefault();
                applyCommandSearch(event.target.value);
            }
        });
    }

    function handleClick(event) {
        if (suppressGraphClick) {
            suppressGraphClick = false;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
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

        var graphViewButton = event.target.closest("[data-graph-view]");
        if (graphViewButton) {
            state.graphView = graphViewButton.dataset.graphView;
            var graph = getActiveGraph();
            state.selectedGraphNodeId = graph && graph.nodes && graph.nodes[0] ? graph.nodes[0].id : "";
            saveState();
            render();
            return;
        }

        var graphNodeButton = event.target.closest("[data-graph-node]");
        if (graphNodeButton) {
            state.selectedGraphNodeId = graphNodeButton.dataset.graphNode;
            saveState();
            updateGraphNodeSelection();
            return;
        }

        var actionButton = event.target.closest("[data-action]");
        if (!actionButton) {
            return;
        }

        var action = actionButton.dataset.action;
        if (action === "new-resident") {
            if (!canManagePersonnel()) {
                toast("Only admins can create resident profiles.");
                return;
            }
            openResidentModal();
        } else if (action === "edit-resident") {
            if (!canManagePersonnel()) {
                toast("Only admins can edit resident profiles.");
                return;
            }
            openResidentModal(getResident(state.selectedResidentId));
        } else if (action === "delete-resident") {
            if (!canManagePersonnel()) {
                toast("Only admins can delete resident profiles.");
                return;
            }
            deleteResident(state.selectedResidentId);
        } else if (action === "new-user") {
            openUserModal();
        } else if (action === "edit-user") {
            openUserModal(getUser(actionButton.dataset.userId));
        } else if (action === "toggle-user") {
            toggleUserStatus(actionButton.dataset.userId);
        } else if (action === "delete-user") {
            deleteUser(actionButton.dataset.userId);
        } else if (action === "assign-user") {
            openAssignmentModal(getUser(actionButton.dataset.userId));
        } else if (action === "remove-assignment") {
            removeUserAssignment(actionButton.dataset.userId, actionButton.dataset.assignmentId);
        } else if (action === "bind-user") {
            openBindingModal(getUser(actionButton.dataset.userId));
        } else if (action === "remove-binding") {
            removeUserBinding(actionButton.dataset.userId, actionButton.dataset.bindingId);
        } else if (action === "new-self-family") {
            openFamilyAccountModal();
        } else if (action === "delete-self-family") {
            deleteSelfFamilyAccount(actionButton.dataset.bindingId);
        } else if (action === "add-self-friend") {
            addSelfFriend();
        } else if (action === "delete-self-friend") {
            deleteSelfFriend(actionButton.dataset.friendshipId);
        } else if (action === "graph-message") {
            openGraphMessage(actionButton.dataset.residentId);
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
        } else if (action === "elderly-action") {
            handleElderlyAction(actionButton.dataset.elderlyAction);
        } else if (action === "generate-ai-insights") {
            generateAiInsights();
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
            event.target.setAttribute("aria-label", event.target.value.trim() ? "Press Enter to search" : "Command search");
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
        } else if (event.target.matches("[data-permission]")) {
            updateResidentPermission(event.target.dataset.permission, event.target.checked);
        }
    }

    function handleSubmit(event) {
        if (event.target.id === "residentForm") {
            event.preventDefault();
            saveResidentForm();
        } else if (event.target.id === "userForm") {
            event.preventDefault();
            saveUserForm();
        } else if (event.target.id === "assignmentForm") {
            event.preventDefault();
            saveAssignmentForm();
        } else if (event.target.id === "bindingForm") {
            event.preventDefault();
            saveBindingForm();
        } else if (event.target.id === "familyAccountForm") {
            event.preventDefault();
            saveFamilyAccountForm();
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

    function handlePointerDown(event) {
        trackGraphPointer(event);
        if (startGraphPinchIfReady(event)) {
            event.preventDefault();
            return;
        }
        var graphNode = event.target.closest(".graph-node[data-graph-node]");
        if (!graphNode) {
            startGraphPan(event);
            return;
        }
        if (event.button !== 0) {
            return;
        }
        var graph = getActiveGraph();
        if (!graph || !graph.nodes) {
            return;
        }
        var node = graph.nodes.find(function (item) {
            return item.id === graphNode.dataset.graphNode;
        });
        if (!node) {
            return;
        }
        graphDrag = {
            graph: graph,
            node: node,
            element: graphNode,
            container: graphNode.closest(".relationship-graph"),
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            moved: false
        };
        graphNode.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    function handlePointerMove(event) {
        if (graphPinch && graphPointers[event.pointerId]) {
            updateTrackedGraphPointer(event);
            applyGraphPinch(event);
            event.preventDefault();
            return;
        }
        if (graphPan && graphPan.pointerId === event.pointerId) {
            var deltaX = event.clientX - graphPan.startX;
            var deltaY = event.clientY - graphPan.startY;
            graphPan.scroll.scrollLeft = graphPan.startScrollLeft - deltaX;
            graphPan.scroll.scrollTop = graphPan.startScrollTop - deltaY;
            graphPan.moved = graphPan.moved || Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
            event.preventDefault();
            return;
        }
        if (!graphDrag || graphDrag.pointerId !== event.pointerId || !graphDrag.container) {
            return;
        }
        var rect = graphDrag.container.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return;
        }
        var nextX = clamp(((event.clientX - rect.left) / rect.width) * 100, 7, 93);
        var nextY = clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 92);
        graphDrag.node.x = Number(nextX.toFixed(1));
        graphDrag.node.y = Number(nextY.toFixed(1));
        graphDrag.element.style.left = graphDrag.node.x + "%";
        graphDrag.element.style.top = graphDrag.node.y + "%";
        graphDrag.moved = graphDrag.moved || Math.abs(event.clientX - graphDrag.startX) > 3 || Math.abs(event.clientY - graphDrag.startY) > 3;
        updateGraphEdgePositions(graphDrag.graph, graphDrag.container);
        event.preventDefault();
    }

    function handlePointerUp(event) {
        if (graphPinch && graphPointers[event.pointerId]) {
            graphPinch.moved = true;
            suppressGraphClick = true;
            saveState();
        }
        delete graphPointers[event.pointerId];
        if (graphPinch && activeGraphPointerCount(graphPinch.scroll) < 2) {
            graphPinch = null;
        }
        if (graphPan && graphPan.pointerId === event.pointerId) {
            if (graphPan.scroll && graphPan.scroll.hasPointerCapture && graphPan.scroll.hasPointerCapture(event.pointerId)) {
                graphPan.scroll.releasePointerCapture(event.pointerId);
            }
            if (graphPan.scroll) {
                graphPan.scroll.classList.remove("is-panning");
            }
            if (graphPan.moved) {
                suppressGraphClick = true;
            }
            graphPan = null;
            return;
        }
        if (!graphDrag || graphDrag.pointerId !== event.pointerId) {
            return;
        }
        if (graphDrag.element && graphDrag.element.hasPointerCapture && graphDrag.element.hasPointerCapture(event.pointerId)) {
            graphDrag.element.releasePointerCapture(event.pointerId);
        }
        if (graphDrag.moved) {
            suppressGraphClick = true;
            saveState();
        }
        graphDrag = null;
    }

    function startGraphPan(event) {
        var scroll = event.target.closest(".graph-scroll");
        if (!scroll || event.button !== 0) {
            return;
        }
        graphPan = {
            scroll: scroll,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startScrollLeft: scroll.scrollLeft,
            startScrollTop: scroll.scrollTop,
            moved: false
        };
        scroll.classList.add("is-panning");
        if (scroll.setPointerCapture) {
            scroll.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
    }

    function handleGraphWheel(event) {
        var scroll = event.target.closest(".graph-scroll");
        if (!scroll) {
            return;
        }
        var currentZoom = getGraphZoom();
        var nextZoom = clamp(currentZoom * Math.exp(-event.deltaY * 0.001), MIN_GRAPH_ZOOM, MAX_GRAPH_ZOOM);
        setGraphZoom(nextZoom, scroll, event.clientX, event.clientY);
        saveState();
        event.preventDefault();
    }

    function trackGraphPointer(event) {
        var scroll = event.target.closest(".graph-scroll");
        if (!scroll || event.pointerType === "mouse") {
            return;
        }
        graphPointers[event.pointerId] = {
            pointerId: event.pointerId,
            scroll: scroll,
            clientX: event.clientX,
            clientY: event.clientY
        };
    }

    function updateTrackedGraphPointer(event) {
        if (!graphPointers[event.pointerId]) {
            return;
        }
        graphPointers[event.pointerId].clientX = event.clientX;
        graphPointers[event.pointerId].clientY = event.clientY;
    }

    function startGraphPinchIfReady(event) {
        var scroll = event.target.closest(".graph-scroll");
        if (!scroll || event.pointerType === "mouse") {
            return false;
        }
        var pointers = activeGraphPointers(scroll);
        if (pointers.length < 2) {
            return false;
        }
        if (graphDrag && graphDrag.element && graphDrag.element.hasPointerCapture && graphDrag.element.hasPointerCapture(graphDrag.pointerId)) {
            graphDrag.element.releasePointerCapture(graphDrag.pointerId);
        }
        graphDrag = null;
        if (graphPan && graphPan.scroll) {
            if (graphPan.scroll.hasPointerCapture && graphPan.scroll.hasPointerCapture(graphPan.pointerId)) {
                graphPan.scroll.releasePointerCapture(graphPan.pointerId);
            }
            graphPan.scroll.classList.remove("is-panning");
        }
        graphPan = null;
        var distance = graphPointerDistance(pointers[0], pointers[1]);
        if (!distance) {
            return false;
        }
        graphPinch = {
            scroll: scroll,
            startDistance: distance,
            startZoom: getGraphZoom(),
            moved: false
        };
        return true;
    }

    function applyGraphPinch(event) {
        var pointers = activeGraphPointers(graphPinch.scroll);
        if (pointers.length < 2 || !graphPinch.startDistance) {
            return;
        }
        var distance = graphPointerDistance(pointers[0], pointers[1]);
        var center = graphPointerCenter(pointers[0], pointers[1]);
        var nextZoom = clamp(graphPinch.startZoom * (distance / graphPinch.startDistance), MIN_GRAPH_ZOOM, MAX_GRAPH_ZOOM);
        setGraphZoom(nextZoom, graphPinch.scroll, center.x, center.y);
        graphPinch.moved = true;
    }

    function activeGraphPointers(scroll) {
        return Object.keys(graphPointers).map(function (key) {
            return graphPointers[key];
        }).filter(function (pointer) {
            return pointer.scroll === scroll;
        });
    }

    function activeGraphPointerCount(scroll) {
        return activeGraphPointers(scroll).length;
    }

    function graphPointerDistance(first, second) {
        var dx = first.clientX - second.clientX;
        var dy = first.clientY - second.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function graphPointerCenter(first, second) {
        return {
            x: (first.clientX + second.clientX) / 2,
            y: (first.clientY + second.clientY) / 2
        };
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function updateGraphEdgePositions(graph, container) {
        var nodeMap = {};
        graph.nodes.forEach(function (node) {
            nodeMap[node.id] = node;
        });
        (graph.edges || []).forEach(function (edge, index) {
            var source = nodeMap[edge.source];
            var target = nodeMap[edge.target];
            if (!source || !target) {
                return;
            }
            var line = container.querySelector('[data-edge-index="' + index + '"]');
            var labels = container.querySelectorAll('[data-edge-label-index="' + index + '"]');
            if (line) {
                line.setAttribute("x1", source.x);
                line.setAttribute("y1", source.y);
                line.setAttribute("x2", target.x);
                line.setAttribute("y2", target.y);
            }
            labels.forEach(function (label) {
                label.setAttribute("x", (source.x + target.x) / 2);
                label.setAttribute("y", (source.y + target.y) / 2);
            });
        });
    }

    function startTopbarClock() {
        updateTopbarClock();
        window.setInterval(updateTopbarClock, 1000);
    }

    function updateTopbarClock() {
        var chip = document.getElementById("currentDateTime");
        if (!chip) {
            return;
        }
        var now = new Date();
        chip.textContent = formatClockDisplay(now);
        chip.title = now.toLocaleString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short"
        });
        chip.setAttribute("datetime", now.toISOString());
    }

    function formatClockDisplay(date) {
        return new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).format(date);
    }

    function render() {
        state.view = currentPage();
        syncPageChrome();
        if (!isFrontendRenderedView()) {
            return;
        }
        hydrateModalSelects();

        if (state.view === "dashboard") {
            renderDashboard();
        } else if (state.view === "personnel") {
            renderPersonnelHome();
        } else if (state.view === "residents") {
            renderResidents();
        } else if (state.view === "personnelAnalytics") {
            renderPersonnelAnalytics();
        } else if (state.view === "users") {
            renderUsers();
        } else {
            renderSettings();
        }
        renderAnalytics();
    }

    function syncPageChrome() {
        document.querySelectorAll("[data-page-link]").forEach(function (link) {
            link.classList.toggle("active", link.dataset.pageLink === state.view);
        });
        updateNavBadges();

        var viewTitleMap = {
            dashboard: ["Dashboard", "Resident-centered care platform"],
            personnel: ["Personnel Network", "Role-based relationship graph"],
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
        var titleNode = document.getElementById("viewTitle");
        var eyebrowNode = document.getElementById("viewEyebrow");
        if (titleNode) {
            titleNode.textContent = title[0];
        }
        if (eyebrowNode) {
            eyebrowNode.textContent = title[1];
        }
    }

    function renderPersonnelLoading() {
        setListPane(
            "Loading Personnel Records",
            "Preparing profile and relationship data",
            '<div class="soft-panel mb-3"><strong>Loading care team data</strong><p class="mb-0 muted-copy">Resident profiles, accounts, family access, care team assignments, and relationship networks are being prepared.</p></div>' +
            '<div class="entity-list">' + emptyState("Loading personnel records", "Please wait while CareBridge prepares this workspace.") + "</div>"
        );
        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Personnel Workspace</p><h2>Loading records</h2></div><span class="badge badge-soft">Loading</span></div>' +
            '<div class="soft-panel"><p class="mb-0 muted-copy">The profile, account, and relationship views will appear when the records are ready.</p></div>';
    }

    function renderPersonnelDatabaseError() {
        setListPane(
            "Records Unavailable",
            "Personnel records could not be loaded",
            '<div class="soft-panel mb-3"><strong>Connection failed</strong><p class="mb-0 muted-copy">' + escapeHtml(personnelApiError) + "</p></div>" +
            '<div class="entity-list">' + emptyState("No personnel records loaded", "Start the database, load the schema and seed data, then reload this page.") + "</div>"
        );
        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Personnel Workspace</p><h2>Unable to display records</h2></div><span class="badge badge-amber">Offline</span></div>' +
            '<div class="soft-panel"><p class="mb-0 muted-copy">Restore the personnel data connection to view accounts, residents, permissions, and relationship networks.</p></div>';
    }

    function renderPersonnelHome() {
        var graph = getActiveGraph();
        var current = state.currentUser;
        setListPane(
            "Personnel Network",
            "Role-aware relationship graph",
            '<div class="graph-tabs mb-3">' + renderGraphViewTabs() + "</div>" +
            '<div id="graphNodeDetailSlot">' + renderGraphNodeDetail(graph) + "</div>" +
            renderGraphStatsPanel(graph, current) +
            renderPersonnelSideManager()
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Relationship Network</p><h2>' + escapeHtml(graph ? graph.title : "No graph available") + '</h2></div><span class="badge badge-teal">Live</span></div>' +
            '<p class="muted-copy">Drag or zoom the network, then select a person to review profile details and connected relationships.</p>' +
            renderGraphCard(graph);
        centerActiveGraphScroll();
    }

    function graphPersonCount(graph) {
        return graph && graph.nodes ? graph.nodes.filter(function (node) {
            return node.type === "account" || node.type === "resident";
        }).length : 0;
    }

    function renderGraphStatsPanel(graph, current) {
        var nodes = graph && graph.nodes ? graph.nodes.length : 0;
        var people = graphPersonCount(graph);
        var relationships = graph && graph.edges ? graph.edges.length : 0;
        var role = current ? current.role : "Guest";
        var peopleMax = Math.max(nodes, people, 1);
        var relationshipMax = Math.max(nodes + relationships, relationships, 1);
        var peoplePercent = Math.round(Math.min(100, people / peopleMax * 100));
        var relationshipPercent = Math.round(Math.min(100, relationships / relationshipMax * 100));
        return '<div class="network-stats-panel mt-3">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Network Snapshot</p><h2>Visible scope</h2></div><span class="badge badge-soft">' + escapeHtml(graph ? graph.title : "No graph") + '</span></div>' +
            '<div class="network-stats-grid">' +
            networkStatDial("People shown", people, peoplePercent, "people") +
            networkStatDial("Relationships", relationships, relationshipPercent, "relationships") +
            "</div>" +
            '<div class="network-role-card">' +
            '<span class="network-role-icon"><i class="fa fa-shield" aria-hidden="true"></i></span>' +
            '<div class="network-role-copy"><span>Current role</span><strong>' + escapeHtml(role) + '</strong></div>' +
            '<div class="network-role-bars" aria-hidden="true"><span></span><span></span><span></span></div>' +
            "</div>" +
            "</div>";
    }

    function networkStatDial(label, value, percent, tone) {
        return '<div class="network-stat-dial network-stat-' + escapeHtml(tone) + '" style="--stat-progress:' + percent + '%;">' +
            '<div class="network-stat-ring"><strong>' + escapeHtml(String(value)) + '</strong></div>' +
            '<span>' + escapeHtml(label) + '</span>' +
            "</div>";
    }

    function getActiveGraph() {
        return (state.personnelGraphs || {})[state.graphView] || (state.personnelGraphs || {})[state.defaultGraphView] || null;
    }

    function renderGraphViewTabs() {
        var views = state.graphViews && state.graphViews.length ? state.graphViews : [{ key: "departmentOverview", label: "Department Overview" }];
        return views.map(function (view) {
            return '<button class="btn btn-sm ' + (view.key === state.graphView ? "btn-primary" : "btn-light") + '" type="button" data-graph-view="' + escapeHtml(view.key) + '">' + escapeHtml(view.label) + "</button>";
        }).join("");
    }

    function centerActiveGraphScroll() {
        requestAnimationFrame(function () {
            var scroll = document.querySelector("[data-graph-scroll]");
            if (!scroll) {
                return;
            }
            scroll.scrollLeft = Math.max(0, (scroll.scrollWidth - scroll.clientWidth) / 2);
            scroll.scrollTop = Math.max(0, (scroll.scrollHeight - scroll.clientHeight) / 2);
        });
    }

    function renderGraphCard(graph) {
        if (!graph || !graph.nodes || !graph.nodes.length) {
            return emptyState("No graph data", "The current role has no visible graph nodes.");
        }
        var selection = graphSelection(graph);
        var densityClass = (graph.nodes.length > 12 || graph.edges.length > 16) ? " is-dense" : "";
        var zoom = getGraphZoom();
        var stageWidth = Math.round(GRAPH_BASE_WIDTH * zoom);
        var stageHeight = Math.round(GRAPH_BASE_HEIGHT * zoom);
        return '<div class="graph-scroll" data-graph-scroll>' +
            '<div class="graph-zoom-stage" data-graph-stage style="width:' + stageWidth + "px;height:" + stageHeight + 'px;">' +
            '<div class="relationship-graph' + densityClass + '" data-graph-canvas style="transform:scale(' + zoom.toFixed(3) + ');" role="img" aria-label="' + escapeHtml(graph.title) + '">' +
            '<svg class="graph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
            renderGraphEdges(graph, selection) +
            "</svg>" +
            graph.nodes.map(function (node) { return renderGraphNode(node, selection); }).join("") +
            "</div></div></div>";
    }

    function graphSelection(graph) {
        var selected = state.selectedGraphNodeId;
        var connected = {};
        var activeEdges = {};
        if (!graph || !selected) {
            return { selected: "", connected: connected, activeEdges: activeEdges };
        }
        (graph.edges || []).forEach(function (edge, index) {
            if (edge.source === selected || edge.target === selected) {
                activeEdges[index] = true;
                connected[edge.source === selected ? edge.target : edge.source] = true;
            }
        });
        return { selected: selected, connected: connected, activeEdges: activeEdges };
    }

    function graphZoomKey() {
        return state.graphView || state.defaultGraphView || "departmentOverview";
    }

    function getGraphZoom() {
        state.graphZooms = state.graphZooms || {};
        var zoom = Number(state.graphZooms[graphZoomKey()]);
        return Number.isFinite(zoom) ? clamp(zoom, MIN_GRAPH_ZOOM, MAX_GRAPH_ZOOM) : 1;
    }

    function setGraphZoom(zoom, scroll, anchorClientX, anchorClientY) {
        state.graphZooms = state.graphZooms || {};
        var currentZoom = getGraphZoom();
        var nextZoom = clamp(Number(zoom) || 1, MIN_GRAPH_ZOOM, MAX_GRAPH_ZOOM);
        var rect = scroll ? scroll.getBoundingClientRect() : null;
        var anchorX = rect ? anchorClientX - rect.left : 0;
        var anchorY = rect ? anchorClientY - rect.top : 0;
        var contentX = scroll && currentZoom ? (scroll.scrollLeft + anchorX) / currentZoom : 0;
        var contentY = scroll && currentZoom ? (scroll.scrollTop + anchorY) / currentZoom : 0;
        state.graphZooms[graphZoomKey()] = Number(nextZoom.toFixed(3));

        if (scroll) {
            var stage = scroll.querySelector("[data-graph-stage]");
            var canvas = scroll.querySelector("[data-graph-canvas]");
            if (stage) {
                stage.style.width = Math.round(GRAPH_BASE_WIDTH * nextZoom) + "px";
                stage.style.height = Math.round(GRAPH_BASE_HEIGHT * nextZoom) + "px";
            }
            if (canvas) {
                canvas.style.transform = "scale(" + nextZoom.toFixed(3) + ")";
            }
            scroll.scrollLeft = Math.max(0, contentX * nextZoom - anchorX);
            scroll.scrollTop = Math.max(0, contentY * nextZoom - anchorY);
        }
    }

    function renderGraphEdges(graph, selection) {
        selection = selection || graphSelection(graph);
        var nodeMap = {};
        graph.nodes.forEach(function (node) {
            nodeMap[node.id] = node;
        });
        return (graph.edges || []).map(function (edge, index) {
            var source = nodeMap[edge.source];
            var target = nodeMap[edge.target];
            if (!source || !target) {
                return "";
            }
            var active = selection.activeEdges[index] ? " active" : "";
            return '<line data-edge-index="' + index + '" data-edge-source="' + escapeHtml(edge.source) + '" data-edge-target="' + escapeHtml(edge.target) + '" x1="' + source.x + '" y1="' + source.y + '" x2="' + target.x + '" y2="' + target.y + '" class="graph-edge graph-edge-' + escapeHtml(edge.type || "default") + active + '"></line>' +
                '<text data-edge-label-index="' + index + '" data-edge-label-source="' + escapeHtml(edge.source) + '" data-edge-label-target="' + escapeHtml(edge.target) + '" x="' + ((source.x + target.x) / 2) + '" y="' + ((source.y + target.y) / 2) + '" class="graph-edge-label-halo' + active + '">' + escapeHtml(edge.label || "") + "</text>" +
                '<text data-edge-label-index="' + index + '" data-edge-label-source="' + escapeHtml(edge.source) + '" data-edge-label-target="' + escapeHtml(edge.target) + '" x="' + ((source.x + target.x) / 2) + '" y="' + ((source.y + target.y) / 2) + '" class="graph-edge-label' + active + '">' + escapeHtml(edge.label || "") + "</text>";
        }).join("");
    }

    function renderGraphNode(node, selection) {
        selection = selection || graphSelection(getActiveGraph());
        var active = node.id === selection.selected ? " active" : "";
        var connected = selection.connected[node.id] ? " connected" : "";
        return '<button class="graph-node graph-node-' + escapeHtml(node.type) + active + connected + '" type="button" data-graph-node="' + escapeHtml(node.id) + '" style="left:' + node.x + "%;top:" + node.y + '%;">' +
            '<span class="graph-node-avatar ' + escapeHtml(node.tone || "") + '">' + graphNodeInitials(node) + "</span>" +
            '<span class="graph-node-label">' + escapeHtml(node.label) + "</span>" +
            '<small>' + escapeHtml(node.badge || node.subtitle || "") + "</small>" +
            "</button>";
    }

    function graphNodeInitials(node) {
        if (node.type === "department") {
            return '<i class="fa fa-building-o" aria-hidden="true"></i>';
        }
        if (node.type === "group") {
            return '<i class="fa fa-comments-o" aria-hidden="true"></i>';
        }
        if (node.type === "role") {
            return '<i class="fa fa-users" aria-hidden="true"></i>';
        }
        if (node.type === "organization") {
            return "CB";
        }
        return escapeHtml(initials(node.label));
    }

    function renderGraphNodeDetail(graph) {
        var node = graph && graph.nodes ? graph.nodes.find(function (item) {
            return item.id === state.selectedGraphNodeId;
        }) : null;
        if (!node && graph && graph.nodes && graph.nodes.length) {
            node = graph.nodes[0];
        }
        if (!node) {
            return "";
        }
        var messageTarget = graphMessageTarget(graph, node);
        var messageButton = messageTarget ? '<button class="btn btn-primary btn-sm" type="button" data-action="graph-message" data-resident-id="' + escapeHtml(messageTarget.residentId) + '"><i class="fa fa-commenting-o me-1" aria-hidden="true"></i>Message</button>' : "";
        return '<div class="node-detail-panel mt-3">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Selected node</p><h2>' + escapeHtml(node.label) + '</h2></div><div class="d-flex align-items-center gap-2 flex-wrap justify-content-end"><span class="badge badge-soft">' + escapeHtml(node.badge || node.type) + '</span>' + messageButton + '</div></div>' +
            '<div class="info-grid">' + Object.keys(node.details || {}).map(function (key) {
                return infoCell(key, node.details[key]);
            }).join("") + "</div></div>";
    }

    function graphMessageTarget(graph, node) {
        if (!graph || !node) {
            return null;
        }
        if (node.type === "resident" && getResident(node.id)) {
            return { residentId: node.id };
        }
        if (node.type !== "account") {
            return null;
        }
        var connectedResidentIds = [];
        (graph.edges || []).forEach(function (edge) {
            var otherId = "";
            if (edge.source === node.id) {
                otherId = edge.target;
            } else if (edge.target === node.id) {
                otherId = edge.source;
            }
            if (otherId && getResident(otherId) && connectedResidentIds.indexOf(otherId) === -1) {
                connectedResidentIds.push(otherId);
            }
        });
        if (connectedResidentIds.length) {
            return { residentId: connectedResidentIds[0] };
        }
        return null;
    }

    function renderPersonnelSideManager() {
        if (!state.currentUser || state.currentUser.role !== "Elderly Resident") {
            return "";
        }
        if (state.graphView === "friendsNetwork") {
            return renderSelfFriendManager();
        }
        return renderSelfFamilyManager();
    }

    function renderSelfFamilyManager() {
        var resident = state.residents[0] || getResident(state.selectedResidentId);
        var bindings = resident && resident.familyBindings ? resident.familyBindings : [];
        return '<div class="node-detail-panel mt-3">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Family Accounts</p><h2>My Family Access</h2></div><button class="btn btn-sm btn-primary" type="button" data-action="new-self-family">Add</button></div>' +
            (bindings.length ? bindings.map(function (binding) {
                return '<div class="completion-row"><div><strong>' + escapeHtml(binding.accountName) + '</strong><div class="entity-subtitle">' + escapeHtml(binding.relationship + (binding.primary ? " - Primary" : "")) + '</div></div><button class="btn btn-sm btn-light text-danger" type="button" data-action="delete-self-family" data-binding-id="' + binding.bindingId + '">Delete</button></div>';
            }).join("") : emptyState("No family account", "Create a Family Member account to bind it to your resident profile.")) +
            "</div>";
    }

    function renderSelfFriendManager() {
        var options = state.personnelOptions || {};
        var friends = Array.isArray(options.friends) ? options.friends : [];
        var candidates = Array.isArray(options.friendCandidates) ? options.friendCandidates : [];
        return '<div class="node-detail-panel mt-3">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Resident Friends</p><h2>Friends Network</h2></div><span class="badge badge-soft">' + friends.length + '</span></div>' +
            '<div class="toolbar-line mb-3">' +
            '<select class="form-select" id="selfFriendCandidateField"' + (candidates.length ? "" : " disabled") + ">" +
            (candidates.length ? candidates.map(function (resident) {
                return '<option value="' + escapeHtml(resident.id) + '">' + escapeHtml(resident.name + " - " + resident.room) + "</option>";
            }).join("") : '<option value="">No residents available</option>') +
            '</select><button class="btn btn-primary" type="button" data-action="add-self-friend"' + (candidates.length ? "" : " disabled") + '>Add</button></div>' +
            (friends.length ? friends.map(function (friend) {
                return '<div class="completion-row"><div><strong>' + escapeHtml(friend.name) + '</strong><div class="entity-subtitle">' + escapeHtml(friend.room + " - " + friend.status) + '</div></div><button class="btn btn-sm btn-light text-danger" type="button" data-action="delete-self-friend" data-friendship-id="' + friend.friendshipId + '">Delete</button></div>';
            }).join("") : emptyState("No friends yet", "Choose a resident from the library to add a friend.")) +
            "</div>";
    }

    function updateGraphNodeSelection() {
        var graph = getActiveGraph();
        var selection = graphSelection(graph);
        document.querySelectorAll("[data-graph-node]").forEach(function (node) {
            node.classList.toggle("active", node.dataset.graphNode === selection.selected);
            node.classList.toggle("connected", Boolean(selection.connected[node.dataset.graphNode]));
        });
        document.querySelectorAll("[data-edge-index]").forEach(function (edge) {
            edge.classList.toggle("active", Boolean(selection.activeEdges[edge.dataset.edgeIndex]));
        });
        document.querySelectorAll("[data-edge-label-index]").forEach(function (label) {
            label.classList.toggle("active", Boolean(selection.activeEdges[label.dataset.edgeLabelIndex]));
        });
        var slot = document.getElementById("graphNodeDetailSlot");
        if (slot) {
            slot.innerHTML = renderGraphNodeDetail(graph);
        }
    }

    function renderDashboard() {
        var grid = document.querySelector(".content-grid");
        if (!grid) {
            return;
        }
        grid.innerHTML =
            '<section class="home-stage" aria-label="CareBridge home">' +
            '<canvas class="home-network-canvas" id="homeNetworkCanvas" aria-hidden="true"></canvas>' +
            '<div class="home-signal-strip" aria-hidden="true">' +
            '<span></span><span></span><span></span><span></span><span></span>' +
            "</div>" +
            '<div class="home-hero-copy">' +
            '<div class="home-kicker"><i class="fa fa-heartbeat" aria-hidden="true"></i><span>Resident-centered care intelligence</span></div>' +
            '<h2>CareBridge</h2>' +
            '<p>Role-aware nursing home coordination for residents, families, and care teams.</p>' +
            '<div class="home-actions">' +
            '<a class="btn btn-primary btn-lg" href="/login"><i class="fa fa-sign-in me-2" aria-hidden="true"></i>Login</a>' +
            "</div>" +
            "</div>" +
            '<div class="home-status-rail" aria-hidden="true">' +
            homeStatusItem("Residents", state.residents.length || 3, "fa-id-card-o") +
            homeStatusItem("Staff", activeStaffCount() || 12, "fa-users") +
            homeStatusItem("Care Signals", completionRate() + "%", "fa-line-chart") +
            "</div>" +
            "</section>";
        startHomeNetwork();
    }

    function homeStatusItem(label, value, icon) {
        return '<div class="home-status-item"><i class="fa ' + icon + '" aria-hidden="true"></i><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(String(value)) + "</strong></div>";
    }

    function startHomeNetwork() {
        if (homeVisualFrame) {
            cancelAnimationFrame(homeVisualFrame);
            homeVisualFrame = null;
        }
        var canvas = document.getElementById("homeNetworkCanvas");
        if (!canvas || !canvas.getContext) {
            return;
        }
        var context = canvas.getContext("2d");
        var points = [];
        var palette = ["51, 112, 255", "21, 184, 166", "245, 166, 35", "123, 104, 238"];

        function resize() {
            var rect = canvas.getBoundingClientRect();
            var ratio = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.floor(rect.width * ratio));
            canvas.height = Math.max(1, Math.floor(rect.height * ratio));
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            var count = Math.max(34, Math.min(72, Math.floor(rect.width / 18)));
            points = [];
            for (var index = 0; index < count; index += 1) {
                points.push({
                    x: Math.random() * rect.width,
                    y: Math.random() * rect.height,
                    vx: (Math.random() - 0.5) * 0.34,
                    vy: (Math.random() - 0.5) * 0.28,
                    tone: palette[index % palette.length]
                });
            }
        }

        function draw() {
            var width = canvas.clientWidth;
            var height = canvas.clientHeight;
            context.clearRect(0, 0, width, height);
            context.fillStyle = "#f6f8fc";
            context.fillRect(0, 0, width, height);
            context.strokeStyle = "rgba(68, 81, 109, 0.12)";
            context.lineWidth = 1;
            for (var gx = 0; gx < width; gx += 46) {
                context.beginPath();
                context.moveTo(gx, 0);
                context.lineTo(gx, height);
                context.stroke();
            }
            for (var gy = 0; gy < height; gy += 46) {
                context.beginPath();
                context.moveTo(0, gy);
                context.lineTo(width, gy);
                context.stroke();
            }
            points.forEach(function (point) {
                point.x += point.vx;
                point.y += point.vy;
                if (point.x < 0 || point.x > width) {
                    point.vx *= -1;
                }
                if (point.y < 0 || point.y > height) {
                    point.vy *= -1;
                }
            });
            for (var a = 0; a < points.length; a += 1) {
                for (var b = a + 1; b < points.length; b += 1) {
                    var dx = points[a].x - points[b].x;
                    var dy = points[a].y - points[b].y;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 150) {
                        context.strokeStyle = "rgba(51, 112, 255, " + (0.22 - distance / 760).toFixed(3) + ")";
                        context.beginPath();
                        context.moveTo(points[a].x, points[a].y);
                        context.lineTo(points[b].x, points[b].y);
                        context.stroke();
                    }
                }
            }
            points.forEach(function (point) {
                context.fillStyle = "rgba(" + point.tone + ", 0.86)";
                context.beginPath();
                context.arc(point.x, point.y, 3.1, 0, Math.PI * 2);
                context.fill();
            });
            homeVisualFrame = requestAnimationFrame(draw);
        }

        resize();
        window.addEventListener("resize", resize, { passive: true });
        draw();
    }

    function renderResidents() {
        var residents = filteredResidents();
        if (residents.length && !residents.some(function (resident) {
            return resident.id === state.selectedResidentId;
        })) {
            state.selectedResidentId = residents[0].id;
            saveState();
        }
        setListPane(
            "Resident Profiles",
            "Search, filter, and open central resident files",
            '<div class="toolbar-line">' +
            '<input class="form-control" id="residentSearch" type="search" placeholder="Search name, room, tag" value="' + escapeHtml(filters.residentSearch) + '">' +
            (canManagePersonnel() ? '<button class="btn btn-primary icon-only" type="button" data-action="new-resident" aria-label="Add resident"><i class="fa fa-plus" aria-hidden="true"></i></button>' : "") +
            "</div>" +
            '<select class="form-select mb-3" id="residentCareFilter">' +
            option("All care levels", filters.residentCare) +
            option("Level I Assisted", filters.residentCare) +
            option("Level II Assisted", filters.residentCare) +
            option("Level III Intensive", filters.residentCare) +
            "</select>" +
            '<div class="entity-list">' + renderEntityRows(residents, renderResidentRow, "No matching residents", "Adjust the search or care-level filter.") + "</div>"
        );
        if (!residents.length) {
            document.getElementById("detailPane").innerHTML = emptyState("No matching residents", "Adjust the search or care-level filter to open a resident profile.");
            renderAnalytics();
            return;
        }
        renderResidentDetail();
        renderAnalytics();
    }

    function renderResidentDetail() {
        var resident = getResident(state.selectedResidentId) || state.residents[0];
        if (!resident) {
            document.getElementById("detailPane").innerHTML = emptyState("No residents yet", "Add a resident to start profile management.");
            return;
        }

        document.getElementById("detailPane").innerHTML =
            renderResidentHero(resident) +
            '<div class="metric-grid">' +
            metricTile("Care level", escapeHtml(resident.careLevel), "Care plan category", "fa-id-card-o") +
            metricTile("Care team", assignedStaffCount(resident), "Active assigned members", "fa-users") +
            metricTile("Primary family", escapeHtml(resident.primaryFamily || "Unassigned"), "Main family contact", "fa-address-book-o") +
            metricTile("Family access", enabledPermissionCount(resident) + "/4", "Enabled permissions", "fa-toggle-on") +
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
            infoCell("Birthday", resident.birthdate || "-") +
            infoCell("Hometown", resident.hometown || "-") +
            infoCell("Admission", resident.admissionDate) +
            infoCell("Primary family", resident.primaryFamily) +
            infoCell("Emergency contact", resident.emergencyContact) +
            infoCell("Status", resident.status) +
            "</div></div>" +
            '<div class="tab-pane fade" id="residentRelations" role="tabpanel">' +
            renderRelationsTable(resident) +
            "</div>" +
            '<div class="tab-pane fade" id="residentPermissions" role="tabpanel">' +
            renderPermissionSettings(resident) +
            "</div>" +
            "</div>";
    }

    function renderResidentProfileSnapshot(resident) {
        var careRecords = state.careRecords.filter(function (record) {
            return record.residentId === resident.id;
        });
        var todayRecord = careRecords.find(function (record) {
            return record.date === today;
        });
        var schedules = state.schedules.filter(function (schedule) {
            return schedule.residentId === resident.id;
        });
        var todaySchedules = schedules.filter(function (schedule) {
            return schedule.start.indexOf(today) === 0;
        });
        var inquiries = state.inquiries.filter(function (inquiry) {
            return inquiry.residentId === resident.id;
        });
        var openInquiryCount = inquiries.filter(function (inquiry) {
            return inquiry.status !== "Closed";
        }).length;
        var observation = latestHealthObservation(resident.id);
        var report = latestReport(resident.id);
        var appointments = state.appointments.filter(function (appointment) {
            return appointment.residentId === resident.id;
        });
        var doctorCount = resident.doctors && resident.doctors.length ? resident.doctors.length : (resident.doctor ? 1 : 0);
        return '<div class="soft-panel mb-3">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Selected resident only</p><h2>Resident profile snapshot</h2></div><span class="badge badge-soft">' + escapeHtml(resident.name) + '</span></div>' +
            '<div class="row g-2">' +
            '<div class="col-md-6">' + quickMetric("Today care record", todayRecord ? todayRecord.mood : "Missing", todayRecord ? "primary" : "warning") + "</div>" +
            '<div class="col-md-6">' + quickMetric("Latest health note", observation ? observation.medication : "No note", observation ? "primary" : "warning") + "</div>" +
            '<div class="col-md-6">' + quickMetric("Today schedules", todaySchedules.length, "primary") + "</div>" +
            '<div class="col-md-6">' + quickMetric("Open inquiries", openInquiryCount, openInquiryCount ? "danger" : "primary") + "</div>" +
            '<div class="col-md-6">' + quickMetric("Reports", report ? report.status : "No report", report ? "primary" : "warning") + "</div>" +
            '<div class="col-md-6">' + quickMetric("Doctors assigned", doctorCount, "primary") + "</div>" +
            '<div class="col-md-6">' + quickMetric("Appointment requests", appointments.length, "warning") + "</div>" +
            '<div class="col-md-6">' + quickMetric("Care records", careRecords.length, "primary") + "</div>" +
            "</div></div>";
    }

    function renderPersonnelAnalytics() {
        setListPane(
            "Analytics Summary",
            "Resident and account record coverage",
            '<div class="soft-panel mb-3"><strong>Coverage summary</strong><p class="mb-0 muted-copy">Resident profiles, care team staffing, family access, account status, and care-level categories are summarized on this page.</p></div>' +
            quickMetric("Resident records", state.residents.length, "primary") +
            quickMetric("Account records", state.users.length, "primary") +
            quickMetric("Active staff", activeStaffCount(), "warning") +
            quickMetric("Care team assignments", allStaffAssignments().length, "primary") +
            quickMetric("Family contacts", allFamilyBindings().length, "primary") +
            quickMetric("Frozen accounts", countFrozenAccounts(), "danger")
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Personnel & Resident Management</p><h2>Profile and staffing analytics</h2></div><span class="badge badge-soft">Live records</span></div>' +
            '<div class="metric-grid">' +
            metricTile("Residents", state.residents.length, "Resident profiles", "fa-id-card-o") +
            metricTile("Accounts", state.users.length, "Staff and family accounts", "fa-users") +
            metricTile("Active staff", activeStaffCount(), "Available care employees", "fa-user-md") +
            metricTile("Frozen accounts", countFrozenAccounts(), "Restricted login records", "fa-lock") +
            "</div>" +
            renderAiInsightPanel() +
            '<div class="analytics-grid mb-3">' +
            chartCard("Resident care levels", "Resident profiles grouped by care level", "chartResidentsByCare") +
            chartCard("Account roles", "Accounts grouped by role", "chartUsersByRole") +
            chartCard("Account status", "Active and frozen account records", "chartAccountStatus") +
            chartCard("Care team responsibilities", "Assigned staff grouped by responsibility", "chartStaffAssignmentResponsibilities") +
            chartCard("Care team coverage", "Linked staff and family contacts per resident", "chartResidentCareTeamCoverage") +
            chartCard("Family access coverage", "Enabled family access permissions", "chartFamilyPermissionCoverage") +
            chartCard("Accounts by department", "Accounts grouped by work area or portal", "chartAccountsByDepartment") +
            chartCard("Core staffing completeness", "Residents with nurse, supervisor, doctor, and caregiver coverage", "chartResidentCoreStaffing") +
            "</div>";
        renderAnalytics();
    }

    function renderAiInsightPanel() {
        var insights = state.aiInsights || {};
        var isLoading = insights.status === "loading";
        var hasResult = insights.status === "ready";
        var hasError = insights.status === "error";
        var riskClass = insights.riskLevel === "High" ? "badge-red" : insights.riskLevel === "Medium" ? "badge-amber" : "badge-teal";
        return '<section class="ai-insight-panel">' +
            '<div class="ai-insight-header">' +
            '<div><p class="eyebrow mb-1">DeepSeek AI</p><h2>Personnel Insight Assistant</h2></div>' +
            '<button class="btn btn-primary btn-sm" type="button" data-action="generate-ai-insights"' + (isLoading ? " disabled" : "") + '>' +
            '<i class="fa ' + (isLoading ? "fa-spinner fa-spin" : "fa-magic") + ' me-1" aria-hidden="true"></i>' + (isLoading ? "Generating" : "Generate AI Insights") +
            "</button></div>" +
            '<p class="muted-copy mb-3">Analyze visible resident coverage, account status, family permissions, and staffing balance with DeepSeek.</p>' +
            (hasResult ? renderAiInsightResult(insights, riskClass) : "") +
            (hasError ? '<div class="ai-insight-error"><strong>AI insight unavailable</strong><p class="mb-0">' + escapeHtml(insights.error || "Request failed") + "</p></div>" : "") +
            (!hasResult && !hasError && !isLoading ? '<div class="ai-insight-empty"><i class="fa fa-lightbulb-o" aria-hidden="true"></i><span>Generate insights before recording your analytics demo.</span></div>' : "") +
            (isLoading ? '<div class="ai-insight-empty"><i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i><span>DeepSeek is reviewing personnel coverage and access settings.</span></div>' : "") +
            "</section>";
    }

    function renderAiInsightResult(insights, riskClass) {
        insights = normalizeAiInsightForDisplay(insights);
        riskClass = insights.riskLevel === "High" ? "badge-red" : insights.riskLevel === "Medium" ? "badge-amber" : "badge-teal";
        return '<div class="ai-insight-result">' +
            '<div class="ai-insight-summary"><span class="badge ' + riskClass + '">' + escapeHtml(insights.riskLevel || "Low") + ' risk</span><p>' + escapeHtml(insights.summary || "No summary returned.") + '</p></div>' +
            '<div class="ai-insight-columns">' +
            aiInsightList("Highlights", insights.highlights, "fa-check-circle-o") +
            aiInsightList("Risks", insights.risks, "fa-exclamation-circle") +
            aiInsightList("Recommendations", insights.recommendations, "fa-arrow-circle-o-right") +
            "</div>" +
            '<div class="ai-insight-meta">Model: ' + escapeHtml(insights.model || "DeepSeek") + (insights.generatedAt ? " · " + escapeHtml(formatDateTime(insights.generatedAt)) : "") + "</div>" +
            "</div>";
    }

    function aiInsightList(title, items, icon) {
        items = Array.isArray(items) ? items : [];
        if (!items.length) {
            items = ["No item returned."];
        }
        return '<div class="ai-insight-list"><h3><i class="fa ' + icon + '" aria-hidden="true"></i>' + escapeHtml(title) + '</h3><ul>' +
            items.map(function (item) {
                return '<li>' + escapeHtml(item) + "</li>";
            }).join("") +
            "</ul></div>";
    }

    function normalizeAiInsightForDisplay(insights) {
        var normalized = Object.assign({}, insights || {});
        var nested = parseInsightJson(normalized.summary);
        if (nested) {
            ["summary", "riskLevel", "highlights", "risks", "recommendations"].forEach(function (key) {
                if (nested[key] !== undefined) {
                    normalized[key] = nested[key];
                }
            });
        }
        normalized.summary = normalizeInsightText(normalized.summary || "No summary returned.");
        normalized.riskLevel = ["Low", "Medium", "High"].indexOf(normalized.riskLevel) > -1 ? normalized.riskLevel : "Low";
        normalized.highlights = normalizeInsightList(normalized.highlights);
        normalized.risks = normalizeInsightList(normalized.risks);
        normalized.recommendations = normalizeInsightList(normalized.recommendations);
        return normalized;
    }

    function parseInsightJson(value) {
        if (typeof value !== "string") {
            return value && typeof value === "object" ? value : null;
        }
        var text = value.trim();
        if (!text || text.charAt(0) !== "{") {
            return null;
        }
        try {
            var parsed = JSON.parse(text);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    function normalizeInsightText(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function normalizeInsightList(value) {
        if (Array.isArray(value)) {
            return value.map(normalizeInsightText).filter(Boolean).slice(0, 5);
        }
        if (typeof value === "string") {
            return value.split(/\n|;/).map(function (item) {
                return normalizeInsightText(item.replace(/^[-•]\s*/, ""));
            }).filter(Boolean).slice(0, 5);
        }
        return [];
    }

    async function generateAiInsights() {
        state.aiInsights = Object.assign({}, state.aiInsights || {}, { status: "loading", error: "" });
        saveState();
        renderPersonnelAnalytics();
        try {
            var response = await apiRequest("/api/personnel/ai-insights", {
                method: "POST",
                body: "{}"
            });
            state.aiInsights = Object.assign({ status: "ready" }, response.insights || {});
            saveState();
            renderPersonnelAnalytics();
            toast("AI insights generated.");
        } catch (error) {
            state.aiInsights = {
                status: "error",
                summary: "",
                riskLevel: "",
                highlights: [],
                risks: [],
                recommendations: [],
                generatedAt: "",
                model: "",
                source: "",
                error: error.message || "AI insight request failed"
            };
            saveState();
            renderPersonnelAnalytics();
            toast(error.message || "AI insight request failed");
        }
    }

    function renderConversations() {
        var conversations = filteredConversations();
        var openInquiryRows = openInquiries();
        setListPane(
            "Conversation Inbox",
            "Unread resident-specific communication",
            '<div class="toolbar-line">' +
            '<input class="form-control" id="conversationSearch" type="search" placeholder="Search conversations" value="' + escapeHtml(filters.conversationSearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-inquiry" aria-label="Create inquiry"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<div class="entity-list">' + renderEntityRows(conversations, renderConversationRow, "No matching conversations", "Adjust the search or create a new inquiry.") + "</div>"
        );

        var unread = state.conversations.filter(function (conversation) {
            return conversation.status !== "archived" && Number(conversation.unread || 0) > 0;
        });
        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Inbox Summary</p><h2>Conversation Triage</h2></div><button class="btn btn-primary btn-sm" type="button" data-action="new-inquiry">Create Inquiry</button></div>' +
            '<div class="metric-grid">' +
            metricTile("Conversations", conversations.length, "Visible message spaces", "fa-comments") +
            metricTile("Unread", unreadConversationCount(), "Messages needing review", "fa-bell-o") +
            metricTile("Open inquiries", openInquiryRows.length, "Pending, processing, or review", "fa-question-circle") +
            metricTile("Messages", totalConversationMessages(), "Threaded message rows", "fa-commenting-o") +
            "</div>" +
            '<div class="row g-3 mb-3">' +
            '<div class="col-xl-6"><div class="section-title"><h2>Unread Conversations</h2></div><div class="entity-list">' + (unread.length ? unread.map(renderConversationRow).join("") : emptyState("No unread messages", "Opening a conversation detail clears its unread badge.")) + "</div></div>" +
            '<div class="col-xl-6"><div class="section-title"><h2>Open Service Inquiries</h2></div><div class="entity-list">' + renderEntityRows(openInquiryRows, renderInquiryListRow, "No open inquiries", "Replied or closed inquiries no longer appear here.") + "</div></div>" +
            "</div>" +
            '<div class="analytics-grid">' +
            chartCard("Inquiry status", "Pending, processing, replied, and closed records", "chartInquiryStatus") +
            chartCard("Message volume", "Chat messages counted by conversation", "chartConversationMessages") +
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
            '<input class="form-control" id="inquirySearch" type="search" placeholder="Search inquiries" value="' + escapeHtml(filters.inquirySearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-inquiry" aria-label="Create inquiry"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<div class="entity-list">' + renderEntityRows(inquiries, renderInquiryListRow, "No matching inquiries", "Adjust the search or create a new service inquiry.") + "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Service Inquiry Records</p><h2>' + inquiries.length + ' inquiries</h2></div><button class="btn btn-primary" type="button" data-action="new-inquiry">Create Inquiry</button></div>' +
            '<div class="table-wrap responsive-table"><table class="table align-middle"><thead><tr><th>Inquiry</th><th>Resident</th><th>Assigned</th><th>Status</th><th>Priority</th><th>Action</th></tr></thead><tbody>' +
            renderTableRows(inquiries, renderInquiryTableRow, 6, "No matching inquiries", "Adjust the search to restore inquiry rows.") +
            "</tbody></table></div>" +
            '<div class="section-title mt-4"><div><p class="eyebrow mb-1">Inquiry Analytics</p><h2>Workflow distribution</h2></div><span class="badge badge-soft">Database-ready</span></div>' +
            '<div class="analytics-grid">' +
            chartCard("Inquiry status", "Inquiry records grouped by status", "chartInquiryStatus") +
            chartCard("Conversations by resident", "Inquiry-linked conversations by resident", "chartConversationResidents") +
            "</div>";
        renderAnalytics();
    }

    function renderConversationDetail() {
        var visibleConversations = filteredConversations();
        var conversation = getConversation(state.activeConversationId);
        if (conversation && visibleConversations.length && !visibleConversations.some(function (item) {
            return item.id === conversation.id;
        })) {
            conversation = visibleConversations[0];
        } else if (conversation && !visibleConversations.length && filters.conversationSearch.trim()) {
            conversation = null;
        }
        if (!conversation || conversation.status === "archived") {
            conversation = visibleConversations[0];
        }
        if (!conversation) {
            setListPane(
                "Conversation Detail",
                "Open another thread without leaving the detail page",
                '<div class="toolbar-line">' +
                '<input class="form-control" id="conversationSearch" type="search" placeholder="Search threads" value="' + escapeHtml(filters.conversationSearch) + '">' +
                '<button class="btn btn-primary icon-only" type="button" data-action="new-inquiry" aria-label="Create inquiry"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
                "</div>" +
                '<div class="entity-list">' + emptyState("No matching conversations", "Adjust the search or create a new inquiry.") + "</div>"
            );
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
            '<input class="form-control" id="conversationSearch" type="search" placeholder="Search threads" value="' + escapeHtml(filters.conversationSearch) + '">' +
            '<button class="btn btn-primary icon-only" type="button" data-action="new-inquiry" aria-label="Create inquiry"><i class="fa fa-plus" aria-hidden="true"></i></button>' +
            "</div>" +
            '<div class="entity-list">' + renderEntityRows(visibleConversations, renderConversationRow, "No matching conversations", "Adjust the search or create a new inquiry.") + "</div>"
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
            '<input class="form-control mb-3" id="scheduleSearch" type="search" placeholder="Search schedules" value="' + escapeHtml(filters.scheduleSearch) + '">' +
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
            "</div>" +
            quickMetric("Visible schedules", schedules.length, "primary") +
            quickMetric("Pending appointments", pendingAppointmentCount(), "warning") +
            quickMetric("Completed tasks", completedScheduleCount(), "primary")
        );

        var resident = getResident(state.selectedResidentId);
        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Staff Calendar</p><h2>June 8 Schedule Board</h2></div><span class="badge badge-soft">Visibility aware</span></div>' +
            '<div class="timeline mb-4">' + renderEntityRows(schedules, renderTimelineItem, "No matching schedules", "Adjust the search or create a schedule.") + "</div>" +
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
            '<input class="form-control mb-3" id="appointmentSearch" type="search" placeholder="Search appointments" value="' + escapeHtml(filters.appointmentSearch) + '">' +
            '<div class="d-grid gap-2 mb-3">' +
            '<button class="btn btn-primary" type="button" data-action="book-appointment"><i class="fa fa-plus me-2" aria-hidden="true"></i>Book Appointment</button>' +
            "</div>" +
            '<div class="entity-list">' + renderEntityRows(appointments, renderAppointmentRow, "No matching appointments", "Adjust the search or book an appointment.") + "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Appointment Approval</p><h2>' + appointments.length + ' family visit and video call requests</h2></div><button class="btn btn-primary" type="button" data-action="book-appointment">New Request</button></div>' +
            '<div class="table-wrap responsive-table mb-4"><table class="table align-middle"><thead><tr><th>Type</th><th>Resident</th><th>Family</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
            renderTableRows(appointments, renderAppointmentTableRow, 6, "No matching appointments", "Adjust the search to restore appointment rows.") +
            "</tbody></table></div>" +
            '<div class="row g-3">' +
            '<div class="col-xl-6">' + renderAppointmentWorkflow() + "</div>" +
            '<div class="col-xl-6">' + chartCard("Appointment status", "Pending, approved, and rejected requests", "chartAppointmentStatus") + "</div>" +
            "</div>";
        renderAnalytics();
    }

    function renderScheduleAnalytics() {
        setListPane(
            "Analytics Summary",
            "Schedule and appointment record coverage",
            '<div class="soft-panel mb-3"><strong>Schedule record model</strong><p class="mb-0 muted-copy">Care tasks, activities, family visits, video calls, approval states, and completion states are summarized on this page.</p></div>' +
            quickMetric("Schedule records", state.schedules.length, "primary") +
            quickMetric("Appointment records", state.appointments.length, "primary") +
            quickMetric("Pending approvals", pendingAppointmentCount(), "warning") +
            quickMetric("Completed tasks", completedScheduleCount(), "primary")
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
            '<input class="form-control mb-3" id="careSearch" type="search" placeholder="Search care records" value="' + escapeHtml(filters.careSearch) + '">' +
            '<div class="soft-panel mb-3"><div class="section-title"><h2>' + completionRate() + '% completed</h2><span class="badge badge-soft">Jun 8</span></div><div class="progress"><div class="progress-bar" style="width:' + completionRate() + '%"></div></div></div>' +
            (completionRows || emptyState("No matching care records", "Adjust the search to restore completion rows."))
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
            '<input class="form-control mb-3" id="observationSearch" type="search" placeholder="Search observations" value="' + escapeHtml(filters.observationSearch) + '">' +
            '<div class="entity-list">' + renderEntityRows(observations, renderObservationRow, "No matching observations", "Adjust the search or submit a nurse observation.") + "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Health Observation</p><h2>Nurse record entry</h2></div><span class="badge badge-soft">Care module page 2</span></div>' +
            '<div class="row g-3 mb-4">' +
            '<div class="col-12">' + renderHealthObservationForm() + "</div>" +
            '<div class="col-12">' +
            '<div class="soft-panel h-100"><div class="section-title"><h2>Observation Records</h2><span class="badge badge-teal">' + observations.length + ' rows</span></div>' +
            '<div class="table-wrap responsive-table"><table class="table align-middle mb-0"><thead><tr><th>Resident</th><th>Vitals</th><th>Medication</th><th>Time</th></tr></thead><tbody>' +
            renderTableRows(observations, renderObservationTableRow, 4, "No matching observations", "Adjust the search to restore observation rows.") +
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
        if (reports.length && !reports.some(function (report) {
            return report.id === state.selectedReportId;
        })) {
            state.selectedReportId = reports[0].id;
            saveState();
        }
        setListPane(
            "Family Daily Reports",
            "Simplified status summaries",
            '<input class="form-control mb-3" id="reportSearch" type="search" placeholder="Search reports" value="' + escapeHtml(filters.reportSearch) + '">' +
            '<div class="d-grid mb-3"><button class="btn btn-primary" type="button" data-action="generate-report"><i class="fa fa-refresh me-2" aria-hidden="true"></i>Generate Selected Report</button></div>' +
            '<div class="entity-list">' + renderEntityRows(reports, renderReportRow, "No matching reports", "Adjust the search or generate a report.") + "</div>"
        );
        if (!reports.length && filters.reportSearch.trim()) {
            document.getElementById("detailPane").innerHTML = emptyState("No matching reports", "Adjust the search to open a report detail.");
            renderAnalytics();
            return;
        }
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
            option("Doctor", filters.userRole) +
            option("Activity Staff", filters.userRole) +
            option("Family Member", filters.userRole) +
            option("Elderly Resident", filters.userRole) +
            "</select>" +
            '<div class="section-title mt-3"><h2>Filtered Accounts</h2><span class="badge badge-soft">' + users.length + "</span></div>" +
            '<div class="entity-list">' + renderEntityRows(users, renderUserListRow, "No matching users", "Adjust the search or role filter.") + "</div>"
        );

        document.getElementById("detailPane").innerHTML =
            '<div class="section-title"><div><p class="eyebrow mb-1">Account Directory</p><h2>' + users.length + ' users</h2></div><button class="btn btn-primary" type="button" data-action="new-user">Add User</button></div>' +
            '<div class="table-wrap responsive-table"><table class="table align-middle"><thead><tr><th>User</th><th>Role</th><th>Department</th><th>Related residents</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
            renderTableRows(users, function (user) {
                return '<tr><td data-label="User">' + renderUserIdentity(user) + '</td><td data-label="Role">' + escapeHtml(user.role) + '</td><td data-label="Department">' + escapeHtml(user.department || "-") + '</td><td data-label="Related residents">' + renderUserAssignmentSummary(user) + '</td><td data-label="Status"><span class="badge ' + (user.status === "Active" ? "badge-teal" : "badge-amber") + '">' + user.status + '</span></td><td data-label="Action"><div class="btn-group btn-group-sm"><button class="btn btn-light" type="button" data-action="edit-user" data-user-id="' + user.id + '">Edit</button>' + (canAssignResident(user) ? '<button class="btn btn-light" type="button" data-action="assign-user" data-user-id="' + user.id + '">Assign</button>' : "") + (canBindResident(user) ? '<button class="btn btn-light" type="button" data-action="bind-user" data-user-id="' + user.id + '">Bind</button>' : "") + '<button class="btn btn-light" type="button" data-action="toggle-user" data-user-id="' + user.id + '">' + (user.status === "Active" ? "Freeze" : "Activate") + '</button><button class="btn btn-light text-danger" type="button" data-action="delete-user" data-user-id="' + user.id + '">Delete</button></div></td></tr>';
            }, 6, "No matching users", "Adjust the search or role filter to restore account rows.") +
            "</tbody></table></div>" +
            renderUserAssignmentManager(users) +
            renderFamilyBindingManager(users);
    }

    function canAssignResident(user) {
        return Boolean(user && ["Nursing Supervisor", "Nurse", "Doctor", "Caregiver", "Activity Staff"].indexOf(user.role) > -1);
    }

    function canBindResident(user) {
        return Boolean(user && user.role === "Family Member");
    }

    function responsibilityOptionsForUser(user) {
        if (!user) {
            return [];
        }
        if (user.role === "Nursing Supervisor") {
            return [{ value: "supervisor", label: "Nurse manager" }];
        }
        if (user.role === "Nurse") {
            return [{ value: "nurse", label: "Primary nurse" }];
        }
        if (user.role === "Doctor") {
            return [{ value: "doctor", label: "Doctor" }];
        }
        if (user.role === "Caregiver") {
            return [
                { value: "maincaregiver", label: "Caregiver" },
                { value: "activitystaff", label: "Activity staff" }
            ];
        }
        if (user.role === "Activity Staff") {
            return [{ value: "activitystaff", label: "Activity staff" }];
        }
        return [];
    }

    function renderResponsibilityOptions(user) {
        return responsibilityOptionsForUser(user).map(function (item) {
            return '<option value="' + escapeHtml(item.value) + '">' + escapeHtml(item.label) + "</option>";
        }).join("");
    }

    function renderUserAssignmentSummary(user) {
        var assignments = (user.assignments || []).concat(user.familyBindings || []);
        if (!assignments.length) {
            return user.residents && user.residents.length ? escapeHtml(user.residents.length + " linked") : '<span class="muted-copy">None</span>';
        }
        return assignments.slice(0, 2).map(function (assignment) {
            return '<span class="badge badge-soft me-1 mb-1">' + escapeHtml(assignment.residentName + " - " + (assignment.label || assignment.relationship || "Linked")) + "</span>";
        }).join("") + (assignments.length > 2 ? '<span class="badge badge-soft">+' + (assignments.length - 2) + "</span>" : "");
    }

    function renderUserAssignmentManager(users) {
        var rows = [];
        users.filter(canAssignResident).forEach(function (user) {
            (user.assignments || []).forEach(function (assignment) {
                rows.push({ user: user, assignment: assignment });
            });
        });
        return '<div class="section-title mt-4"><div><p class="eyebrow mb-1">Care Team Assignments</p><h2>Resident Assignments</h2></div><span class="badge badge-soft">' + rows.length + '</span></div>' +
            '<div class="table-wrap responsive-table"><table class="table align-middle mb-0"><thead><tr><th>Staff</th><th>Resident</th><th>Responsibility</th><th>Room</th><th>Action</th></tr></thead><tbody>' +
            renderTableRows(rows, function (row) {
                return '<tr><td data-label="Staff"><strong>' + escapeHtml(row.user.name) + '</strong><div class="entity-subtitle">' + escapeHtml(row.user.role) + '</div></td><td data-label="Resident">' + escapeHtml(row.assignment.residentName) + '</td><td data-label="Responsibility"><span class="badge badge-teal">' + escapeHtml(row.assignment.label) + '</span></td><td data-label="Room">' + escapeHtml(row.assignment.room || "-") + '</td><td data-label="Action"><button class="btn btn-sm btn-light text-danger" type="button" data-action="remove-assignment" data-user-id="' + row.user.id + '" data-assignment-id="' + row.assignment.assignmentId + '">Remove</button></td></tr>';
            }, 5, "No staff assignments", "Use Assign on a staff account to connect that account to a resident.") +
            "</tbody></table></div>";
    }

    function renderFamilyBindingManager(users) {
        var rows = [];
        users.filter(canBindResident).forEach(function (user) {
            (user.familyBindings || []).forEach(function (binding) {
                rows.push({ user: user, binding: binding });
            });
        });
        return '<div class="section-title mt-4"><div><p class="eyebrow mb-1">Family Access</p><h2>Family Resident Access</h2></div><span class="badge badge-soft">' + rows.length + '</span></div>' +
            '<div class="table-wrap responsive-table"><table class="table align-middle mb-0"><thead><tr><th>Family member</th><th>Resident</th><th>Relationship</th><th>Primary</th><th>Action</th></tr></thead><tbody>' +
            renderTableRows(rows, function (row) {
                return '<tr><td data-label="Family member"><strong>' + escapeHtml(row.user.name) + '</strong><div class="entity-subtitle">' + escapeHtml(row.user.phone) + '</div></td><td data-label="Resident">' + escapeHtml(row.binding.residentName) + '</td><td data-label="Relationship"><span class="badge badge-amber">' + escapeHtml(row.binding.relationship) + '</span></td><td data-label="Primary">' + (row.binding.primary ? '<span class="badge badge-teal">Primary</span>' : '<span class="badge badge-soft">Linked</span>') + '</td><td data-label="Action"><button class="btn btn-sm btn-light text-danger" type="button" data-action="remove-binding" data-user-id="' + row.user.id + '" data-binding-id="' + row.binding.bindingId + '">Unbind</button></td></tr>';
            }, 5, "No family bindings", "Use Bind on a Family Member account to connect that account to a resident.") +
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

    function renderAnalytics() {
        if (!window.CareBridgeCharts) {
            return;
        }
        requestAnimationFrame(function () {
            window.CareBridgeCharts.render(buildAnalyticsPayload());
        });
    }

    function buildAnalyticsPayload() {
        var residentAnalytics = buildResidentAnalytics(state.selectedResidentId);
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
            staffAssignmentResponsibilities: asChart(countBy(allStaffAssignments(), function (assignment) {
                return assignment.label || assignment.responsibility || "Unassigned";
            })),
            residentCareTeamCoverage: buildResidentCareTeamCoverage(),
            familyPermissionCoverage: buildFamilyPermissionCoverage(),
            accountsByDepartment: asChart(countBy(state.users, function (user) {
                return accountDepartmentLabel(user);
            })),
            residentCoreStaffing: asChart(countResidentCoreStaffing()),
            inquiriesByStatus: asChart(countBy(state.inquiries, function (inquiry) {
                return inquiry.status;
            })),
            conversationsByResident: asChart(countBy(state.conversations, function (conversation) {
                var resident = getResident(conversation.residentId);
                return resident ? resident.name : "Unassigned";
            })),
            messagesByConversation: {
                labels: state.conversations.map(function (conversation) {
                    return conversation.title;
                }),
                values: state.conversations.map(function (conversation) {
                    return (conversation.messages || []).length;
                })
            },
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
            }),
            residentCareSignals: residentAnalytics.careSignals,
            residentScheduleTypes: residentAnalytics.scheduleTypes,
            residentCommunication: residentAnalytics.communication,
            residentVitals: residentAnalytics.vitals
        };
    }

    function allStaffAssignments() {
        return state.users.reduce(function (rows, user) {
            (user.assignments || []).forEach(function (assignment) {
                rows.push(assignment);
            });
            return rows;
        }, []);
    }

    function allFamilyBindings() {
        return state.users.reduce(function (rows, user) {
            (user.familyBindings || []).forEach(function (binding) {
                rows.push(binding);
            });
            return rows;
        }, []);
    }

    function buildResidentCareTeamCoverage() {
        return {
            labels: state.residents.map(function (resident) {
                return resident.name;
            }),
            values: state.residents.map(function (resident) {
                return residentCareTeamCount(resident);
            })
        };
    }

    function residentCareTeamCount(resident) {
        var total = 0;
        total += resident.nurse ? 1 : 0;
        total += resident.supervisor ? 1 : 0;
        total += Array.isArray(resident.doctors) ? resident.doctors.length : (resident.doctor ? 1 : 0);
        total += Array.isArray(resident.caregivers) ? resident.caregivers.length : 0;
        total += Array.isArray(resident.activityStaffMembers) ? resident.activityStaffMembers.length : 0;
        total += Array.isArray(resident.familyBindings) ? resident.familyBindings.length : 0;
        return total;
    }

    function buildFamilyPermissionCoverage() {
        var totals = {
            "Daily reports": 0,
            "Appointments": 0,
            "Staff schedules": 0,
            "Health attachments": 0
        };
        state.residents.forEach(function (resident) {
            (resident.familyBindings || []).forEach(function (binding) {
                var permissions = binding.permissions || {};
                totals["Daily reports"] += permissions.dailyReports ? 1 : 0;
                totals["Appointments"] += permissions.appointments ? 1 : 0;
                totals["Staff schedules"] += permissions.staffSchedules ? 1 : 0;
                totals["Health attachments"] += permissions.healthAttachments ? 1 : 0;
            });
        });
        return asChart(totals);
    }

    function accountDepartmentLabel(user) {
        if (user.department) {
            return user.department;
        }
        if (user.role === "Elderly Resident") {
            return "Resident Portal";
        }
        if (user.role === "Family Member") {
            return "Family Portal";
        }
        return "Unassigned";
    }

    function countResidentCoreStaffing() {
        return state.residents.reduce(function (result, resident) {
            var hasCoreTeam = Boolean(
                resident.nurse &&
                resident.supervisor &&
                ((resident.doctors && resident.doctors.length) || resident.doctor) &&
                resident.caregivers &&
                resident.caregivers.length
            );
            result[hasCoreTeam ? "Complete core team" : "Needs assignment"] += 1;
            return result;
        }, {
            "Complete core team": 0,
            "Needs assignment": 0
        });
    }

    function buildResidentAnalytics(residentId) {
        var records = state.careRecords.filter(function (record) {
            return record.residentId === residentId;
        });
        var latestRecord = records.slice(-1)[0];
        var schedules = state.schedules.filter(function (schedule) {
            return schedule.residentId === residentId;
        });
        var conversations = state.conversations.filter(function (conversation) {
            return conversation.residentId === residentId;
        });
        var inquiries = state.inquiries.filter(function (inquiry) {
            return inquiry.residentId === residentId;
        });
        var observation = latestHealthObservation(residentId);
        var closedInquiries = inquiries.filter(function (inquiry) {
            return inquiry.status === "Closed";
        }).length;
        var openInquiries = inquiries.length - closedInquiries;

        return {
            careSignals: residentCareSignals(latestRecord),
            scheduleTypes: asChart(countBy(schedules, function (schedule) {
                return schedule.type;
            })),
            communication: asChart({
                "Unread messages": conversations.reduce(function (total, conversation) {
                    return total + Number(conversation.unread || 0);
                }, 0),
                "Open inquiries": openInquiries,
                "Closed inquiries": closedInquiries
            }),
            vitals: residentVitals(observation)
        };
    }

    function residentCareSignals(record) {
        if (!record) {
            return { labels: [], values: [] };
        }
        var positive = 0;
        var attention = 0;
        [
            ["meal", ["Normal"]],
            ["sleep", ["Good"]],
            ["mood", ["Stable", "Happy"]],
            ["activity", ["Joined activity", "Short walk"]],
            ["hygiene", ["Completed"]],
            ["mobility", ["Independent"]]
        ].forEach(function (rule) {
            if (rule[1].indexOf(record[rule[0]]) > -1) {
                positive += 1;
            } else {
                attention += 1;
            }
        });
        return asChart({
            "Positive signals": positive,
            "Needs attention": attention
        });
    }

    function residentVitals(observation) {
        if (!observation) {
            return { labels: [], values: [] };
        }
        var pressure = String(observation.bloodPressure || "").split("/");
        return {
            labels: ["Systolic BP", "Diastolic BP", "Heart rate", "Temperature C", "Blood sugar"],
            values: [
                Number(pressure[0]) || 0,
                Number(pressure[1]) || 0,
                Number(observation.heartRate) || 0,
                Number(observation.temperature) || 0,
                Number(observation.bloodSugar) || 0
            ]
        };
    }

    function countBy(collection, accessor) {
        return collection.reduce(function (result, item) {
            var key = accessor(item) || "Unknown";
            result[key] = (result[key] || 0) + 1;
            return result;
        }, {});
    }

    function totalConversationMessages() {
        return state.conversations.reduce(function (total, conversation) {
            return total + (conversation.messages ? conversation.messages.length : 0);
        }, 0);
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
        var adminActions = canManagePersonnel()
            ? '<button class="btn btn-light btn-sm" type="button" data-action="edit-resident"><i class="fa fa-pencil me-1" aria-hidden="true"></i>Edit</button>' +
            '<button class="btn btn-light btn-sm text-danger" type="button" data-action="delete-resident"><i class="fa fa-trash-o me-1" aria-hidden="true"></i>Delete</button>'
            : "";
        return '<div class="profile-heading">' +
            '<div class="profile-heading-main">' +
            '<div class="avatar resident-avatar ' + escapeHtml(resident.tone || "") + '">' + initials(resident.name) + '</div>' +
            '<div class="min-w-0"><p class="eyebrow mb-1">Resident Profile</p><h2>' + escapeHtml(resident.name) + '</h2><div class="entity-subtitle">' + escapeHtml(resident.room + " - " + resident.careLevel) + '</div></div>' +
            "</div>" +
            '<div class="d-flex flex-wrap gap-2 justify-content-end">' +
            adminActions +
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
            infoCell("Caregiver", resident.caregiver) +
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
            '<div class="col-12"><div class="table-wrap responsive-table"><table class="table align-middle"><thead><tr><th>Resident</th><th>Caregiver</th><th>Meal</th><th>Mood</th><th>Mobility</th><th>Visibility</th><th>Action</th></tr></thead><tbody>' +
            renderTableRows(records, function (record) {
                var resident = getResident(record.residentId);
                return '<tr><td data-label="Resident">' + escapeHtml(resident.name) + '</td><td data-label="Caregiver">' + escapeHtml(record.caregiver) + '</td><td data-label="Meal">' + escapeHtml(record.meal) + '</td><td data-label="Mood">' + escapeHtml(record.mood) + '</td><td data-label="Mobility">' + escapeHtml(record.mobility) + '</td><td data-label="Visibility"><span class="badge ' + (record.visible ? "badge-teal" : "badge-amber") + '">' + (record.visible ? "Family visible" : "Staff only") + '</span></td><td data-label="Action"><button class="btn btn-sm btn-light text-danger" type="button" data-action="delete-care-record" data-record-id="' + record.id + '">Delete</button></td></tr>';
            }, 7, "No matching care records", "Adjust the search to restore review rows.") +
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

    function renderUserListRow(user) {
        return '<div class="entity-row static-row">' +
            '<div class="avatar avatar-small avatar-staff ' + roleToneClass(user.role) + '">' + initials(user.name) + '</div>' +
            '<div class="entity-body"><div class="entity-title">' + escapeHtml(user.name) + '</div><div class="entity-subtitle">' + escapeHtml(user.role + " - " + user.department) + '</div><div class="entity-meta">' + escapeHtml(user.residents.length + " linked residents") + '</div></div>' +
            '<span class="badge ' + (user.status === "Active" ? "badge-teal" : "badge-amber") + '">' + escapeHtml(user.status) + "</span>" +
            "</div>";
    }

    function renderUserIdentity(user) {
        return '<div class="profile-heading-main"><div class="avatar avatar-small avatar-staff ' + roleToneClass(user.role) + '">' + initials(user.name) + '</div><div class="min-w-0"><strong>' + escapeHtml(user.name) + '</strong><div class="entity-subtitle">' + escapeHtml((user.username ? user.username + " - " : "") + user.phone) + '</div></div></div>';
    }

    function renderAccountMini(name, role) {
        var displayName = name || "Unassigned";
        var displayRole = role || "Staff";
        return '<div class="account-mini">' +
            '<div class="avatar avatar-small avatar-staff ' + roleToneClass(displayRole) + '">' + initials(displayName) + '</div>' +
            '<div class="account-mini-copy"><strong>' + escapeHtml(displayName) + '</strong><span>' + escapeHtml(displayRole) + '</span></div>' +
            "</div>";
    }

    function roleToneClass(role) {
        if (role === "Admin") {
            return "tone-admin";
        }
        if (role === "Nursing Supervisor") {
            return "tone-supervisor";
        }
        if (role === "Nurse") {
            return "tone-nurse";
        }
        if (role === "Doctor") {
            return "tone-doctor";
        }
        if (role === "Caregiver") {
            return "tone-caregiver";
        }
        if (role === "Activity Staff") {
            return "tone-activity";
        }
        if (role === "Family Member") {
            return "tone-family";
        }
        if (role === "Elderly Resident") {
            return "tone-resident";
        }
        return "tone-staff";
    }

    function renderInquiryTableRow(inquiry) {
        var resident = getResident(inquiry.residentId);
        return '<tr><td data-label="Inquiry"><strong>' + escapeHtml(inquiry.title) + '</strong><div class="entity-subtitle">' + escapeHtml(inquiry.description) + '</div></td><td data-label="Resident">' + escapeHtml(resident ? resident.name : "Unassigned") + '</td><td data-label="Assigned">' + escapeHtml(inquiry.assignedTo) + '</td><td data-label="Status"><span class="badge ' + inquiryBadge(inquiry.status) + '">' + escapeHtml(inquiry.status) + '</span></td><td data-label="Priority">' + escapeHtml(inquiry.priority) + '</td><td data-label="Action"><div class="btn-group btn-group-sm"><button class="btn btn-light" type="button" data-action="set-inquiry-status" data-inquiry-id="' + inquiry.id + '" data-status="Processing">Processing</button><button class="btn btn-light" type="button" data-action="set-inquiry-status" data-inquiry-id="' + inquiry.id + '" data-status="Closed">Close</button><button class="btn btn-light text-danger" type="button" data-action="delete-inquiry" data-inquiry-id="' + inquiry.id + '">Delete</button></div></td></tr>';
    }

    function renderTimelineItem(item) {
        var resident = getResident(item.residentId);
        return '<div class="timeline-item">' +
            '<div class="timeline-time">' + formatTime(item.start) + '</div>' +
            '<div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(resident.name + " - " + item.location + " - " + item.staff) + '</p></div>' +
            '<div class="timeline-actions d-flex align-items-center gap-2 flex-wrap justify-content-end"><span class="badge ' + scheduleBadge(item.status) + '">' + escapeHtml(item.status) + '</span>' +
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
        return '<tr><td data-label="Type"><strong>' + escapeHtml(item.type) + '</strong><div class="entity-subtitle">' + escapeHtml(item.purpose) + '</div></td><td data-label="Resident">' + escapeHtml(resident ? resident.name : "Unassigned") + '</td><td data-label="Family">' + escapeHtml(item.family) + '</td><td data-label="Time">' + formatDateTime(item.time) + '</td><td data-label="Status"><span class="badge ' + scheduleBadge(item.status) + '">' + escapeHtml(item.status) + '</span></td><td data-label="Action"><div class="btn-group btn-group-sm">' + (item.status === "Pending" ? '<button class="btn btn-light" type="button" data-action="approve-appointment" data-appointment-id="' + item.id + '">Approve</button><button class="btn btn-light" type="button" data-action="reject-appointment" data-appointment-id="' + item.id + '">Reject</button>' : "") + '<button class="btn btn-light text-danger" type="button" data-action="delete-appointment" data-appointment-id="' + item.id + '">Delete</button></div></td></tr>';
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
        return '<tr><td data-label="Resident"><strong>' + escapeHtml(resident ? resident.name : "Unassigned") + '</strong><div class="entity-subtitle">' + escapeHtml(observation.nurse) + '</div></td><td data-label="Vitals">' + escapeHtml(observation.bloodPressure + " BP / " + observation.heartRate + " HR / " + observation.temperature + " C") + '</td><td data-label="Medication">' + escapeHtml(observation.medication) + '</td><td data-label="Time">' + formatDateTime(observation.time) + "</td></tr>";
    }

    function renderRelationsTable(resident) {
        var staffRows = relationRowsForAccounts("Caregiver", "Caregiver", resident.caregivers) +
            relationRow("Primary nurse", "Nurse", resident.nurse) +
            relationRowsForAccounts("Doctor", "Doctor", resident.doctors) +
            relationRow("Nurse manager", "Nursing Supervisor", resident.supervisor) +
            relationRowsForAccounts("Activity staff", "Activity Staff", resident.activityStaffMembers);
        var familyRows = (resident.familyBindings || []).map(function (binding) {
            return '<tr><td>' + renderAccountMini(binding.accountName || "Unassigned", "Family Member") + '</td><td>' + escapeHtml(binding.relationship || "Family") + (binding.primary ? ' <span class="badge badge-teal ms-1">Primary</span>' : "") + '</td><td>' + escapeHtml(permissionSummary({ permissions: binding.permissions || defaultResidentPermissions() })) + '</td></tr>';
        }).join("") || '<tr><td>' + renderAccountMini(resident.primaryFamily || "Unassigned", "Family Member") + '</td><td>' + escapeHtml(resident.familyRelationship || "Family") + '</td><td>' + escapeHtml(permissionSummary(resident)) + '</td></tr>';
        return '<div class="row g-3">' +
            '<div class="col-xl-6"><div class="section-title"><h2>Assigned Staff</h2><span class="badge badge-soft">Active</span></div><div class="table-wrap"><table class="table align-middle"><thead><tr><th>Responsibility</th><th>Name</th><th>Status</th></tr></thead><tbody>' +
            staffRows +
            "</tbody></table></div></div>" +
            '<div class="col-xl-6"><div class="section-title"><h2>Family Bindings</h2><span class="badge badge-teal">' + escapeHtml(String((resident.familyBindings || []).length || 1)) + '</span></div><div class="table-wrap"><table class="table align-middle"><thead><tr><th>Family member</th><th>Relationship</th><th>Permissions</th></tr></thead><tbody>' +
            familyRows +
            '<tr><td>' + renderAccountMini(resident.emergencyContact || "Unassigned", "Family Member") + '</td><td>Emergency contact</td><td>Emergency contact record</td></tr>' +
            "</tbody></table></div></div>" +
            "</div>";
    }

    function relationRowsForAccounts(label, fallbackRole, accounts) {
        accounts = Array.isArray(accounts) ? accounts : [];
        if (!accounts.length) {
            return relationRow(label, fallbackRole, "");
        }
        return accounts.map(function (account) {
            return relationRow(label, account.role || fallbackRole, account.name);
        }).join("");
    }

    function renderPermissionSettings(resident) {
        var permissions = getResidentPermissions(resident);
        return '<div class="soft-panel">' +
            '<div class="section-title"><div><p class="eyebrow mb-1">Visibility for ' + escapeHtml(resident.primaryFamily) + '</p><h2>Family access permissions</h2></div></div>' +
            permissionSwitch("View daily care reports", "dailyReports", permissions.dailyReports) +
            permissionSwitch("Create visit or video appointments", "appointments", permissions.appointments) +
            permissionSwitch("View staff-only schedules", "staffSchedules", permissions.staffSchedules) +
            permissionSwitch("Download health attachments", "healthAttachments", permissions.healthAttachments) +
            '<p class="muted-copy mb-0 mt-3">These settings control what the selected family contact can view or request for this resident.</p>' +
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
        return '<div class="completion-row"><span>' + escapeHtml(label) + '</span><span class="badge ' + className + '">' + escapeHtml(String(value)) + "</span></div>";
    }

    function metricTile(label, value, note, icon) {
        return '<div class="stat-tile"><div class="d-flex justify-content-between align-items-center"><span>' + escapeHtml(label) + '</span><i class="fa ' + icon + ' text-primary" aria-hidden="true"></i></div><strong>' + value + '</strong><span>' + escapeHtml(note) + "</span></div>";
    }

    function metricPanel(label, value, icon) {
        return '<div class="stat-tile"><div class="d-flex justify-content-between align-items-center"><span>' + escapeHtml(label) + '</span><i class="fa ' + icon + ' text-primary" aria-hidden="true"></i></div><strong>' + value + '</strong></div>';
    }

    function moduleCard(title, copy, icon) {
        return '<div class="app-card"><div class="card-icon"><i class="fa ' + icon + '" aria-hidden="true"></i></div><h3>' + escapeHtml(title) + '</h3><p class="mb-0">' + escapeHtml(copy) + "</p></div>";
    }

    function appInfoCard(title, copy, icon) {
        return '<div class="app-card"><div class="card-icon"><i class="fa ' + icon + '" aria-hidden="true"></i></div><h3>' + escapeHtml(title) + '</h3><p class="mb-0">' + escapeHtml(copy) + "</p></div>";
    }

    function chartCard(title, copy, id) {
        var scrollable = id === "chartAccountsByDepartment";
        return '<div class="chart-card' + (scrollable ? " chart-card-scroll" : "") + '"><div class="section-title"><div><p class="eyebrow mb-1">' + escapeHtml(copy) + '</p><h3>' + escapeHtml(title) + '</h3></div></div><div class="chart-canvas-wrap"><canvas class="chart-canvas" id="' + escapeHtml(id) + '" height="220" aria-label="' + escapeHtml(title) + ' chart"></canvas></div></div>';
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
        return '<div class="timeline-item"><div class="timeline-time">' + escapeHtml(number) + '</div><div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(copy) + '</p></div><span class="timeline-step-badge badge badge-soft">Step</span></div>';
    }

    function elderlyAction(label, icon) {
        return '<button class="elderly-action" type="button" data-action="elderly-action" data-elderly-action="' + escapeHtml(label) + '"><i class="fa ' + icon + '" aria-hidden="true"></i><strong>' + escapeHtml(label) + '</strong></button>';
    }

    function relationRow(responsibility, role, name) {
        return '<tr><td>' + escapeHtml(responsibility) + '</td><td>' + renderAccountMini(name || "Unassigned", role) + '</td><td><span class="badge ' + (name ? "badge-teal" : "badge-soft") + '">' + (name ? "Active" : "Missing") + "</span></td></tr>";
    }

    function permissionSwitch(label, key, checked) {
        var id = "perm-" + key;
        return '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="' + id + '" data-permission="' + escapeHtml(key) + '"' + (checked ? " checked" : "") + '><label class="form-check-label" for="' + id + '">' + escapeHtml(label) + "</label></div>";
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

    function renderEntityRows(collection, renderer, emptyTitle, emptyCopy) {
        return collection.length ? collection.map(renderer).join("") : emptyState(emptyTitle, emptyCopy);
    }

    function renderTableRows(collection, renderer, colspan, emptyTitle, emptyCopy) {
        if (collection.length) {
            return collection.map(renderer).join("");
        }
        return '<tr><td colspan="' + colspan + '">' + emptyState(emptyTitle, emptyCopy) + "</td></tr>";
    }

    function defaultResidentPermissions() {
        return {
            dailyReports: true,
            appointments: true,
            staffSchedules: false,
            healthAttachments: false
        };
    }

    function getResidentPermissions(resident) {
        var permissions = Object.assign(defaultResidentPermissions(), resident.permissions || {});
        resident.permissions = permissions;
        return permissions;
    }

    function assignedStaffCount(resident) {
        var doctorCount = resident.doctors && resident.doctors.length ? resident.doctors.length : (resident.doctor ? 1 : 0);
        var caregiverCount = resident.caregivers && resident.caregivers.length ? resident.caregivers.length : (resident.caregiver ? 1 : 0);
        var activityCount = resident.activityStaffMembers && resident.activityStaffMembers.length ? resident.activityStaffMembers.length : (resident.activityStaff ? 1 : 0);
        return doctorCount + caregiverCount + activityCount + [
            resident.nurse,
            resident.supervisor
        ].filter(Boolean).length;
    }

    function enabledPermissionCount(resident) {
        var permissions = getResidentPermissions(resident);
        return Object.keys(permissions).filter(function (key) {
            return permissions[key];
        }).length;
    }

    function permissionSummary(resident) {
        var permissions = getResidentPermissions(resident);
        var labels = [];
        if (permissions.dailyReports) {
            labels.push("daily reports");
        }
        if (permissions.appointments) {
            labels.push("appointments");
        }
        if (permissions.staffSchedules) {
            labels.push("staff schedules");
        }
        if (permissions.healthAttachments) {
            labels.push("health attachments");
        }
        return labels.length ? labels.join(", ") : "No family visibility enabled";
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
            if (conversation.status === "archived") {
                return false;
            }
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
            return;
        }
        toast("No matching resident or page.");
    }

    function setFormError(id, message) {
        var element = document.getElementById(id);
        if (!element) {
            return;
        }
        element.textContent = message || "";
        element.classList.toggle("d-none", !message);
    }

    function accountOptions(selectedId, roles) {
        var selectedIds = Array.isArray(selectedId) ? selectedId : [selectedId].filter(Boolean);
        var users = state.users.filter(function (user) {
            return !roles || roles.indexOf(user.role) > -1;
        });
        if (!users.length) {
            users = state.users.slice();
        }
        return users.map(function (user) {
            return '<option value="' + escapeHtml(user.id) + '"' + (selectedIds.indexOf(user.id) > -1 ? " selected" : "") + ">" + escapeHtml(user.name + " - " + user.role) + "</option>";
        }).join("");
    }

    function populateResidentAccountSelects(resident) {
        var familyId = resident ? resident.familyAccountId : "";
        var caregiverId = resident ? resident.caregiverAccountId : "";
        var nurseId = resident ? resident.nurseAccountId : "";
        var doctorIds = resident && resident.doctors && resident.doctors.length ? resident.doctors.map(function (doctor) {
            return doctor.id;
        }) : (resident && resident.doctorAccountId ? [resident.doctorAccountId] : []);
        var supervisorId = resident ? resident.supervisorAccountId : "";
        var activityId = resident ? resident.activityStaffAccountId : "";
        var family = document.getElementById("residentFamilyAccountField");
        var caregiver = document.getElementById("residentCaregiverField");
        var nurse = document.getElementById("residentNurseField");
        var doctor = document.getElementById("residentDoctorField");
        var supervisor = document.getElementById("residentSupervisorField");
        var activity = document.getElementById("residentActivityStaffField");
        if (family) {
            family.innerHTML = accountOptions(familyId, ["Family Member"]);
        }
        if (caregiver) {
            caregiver.innerHTML = accountOptions(caregiverId, ["Caregiver"]);
        }
        if (nurse) {
            nurse.innerHTML = accountOptions(nurseId, ["Nurse"]);
        }
        if (doctor) {
            doctor.innerHTML = accountOptions(doctorIds, ["Doctor"]);
        }
        if (supervisor) {
            supervisor.innerHTML = accountOptions(supervisorId, ["Nursing Supervisor", "Admin"]);
        }
        if (activity) {
            activity.innerHTML = accountOptions(activityId, ["Activity Staff", "Caregiver"]);
        }
    }

    function openResidentModal(resident) {
        document.getElementById("residentForm").reset();
        setFormError("residentFormError", "");
        populateResidentAccountSelects(resident);
        document.getElementById("residentIdField").value = resident ? resident.id : "";
        document.getElementById("residentModalTitle").textContent = resident ? "Edit Resident" : "Add Resident";
        document.getElementById("residentAdmissionField").value = resident ? resident.admissionDate : today;
        document.getElementById("residentBirthdateField").value = resident ? (resident.birthdate || "") : "";
        document.getElementById("residentHometownField").value = resident ? (resident.hometown || "") : "";
        document.getElementById("residentStatusField").value = resident ? resident.status : "Active";
        document.getElementById("residentFamilyRelationshipField").value = resident ? (resident.familyRelationship || "Family") : "Daughter";
        document.getElementById("residentEmergencyField").value = resident ? resident.emergencyContact : "";
        if (resident) {
            document.getElementById("residentNameField").value = resident.name;
            document.getElementById("residentAgeField").value = resident.age;
            document.getElementById("residentGenderField").value = resident.gender;
            document.getElementById("residentRoomField").value = resident.room;
            document.getElementById("residentBedField").value = resident.bed;
            document.getElementById("residentFloorField").value = resident.floor;
            document.getElementById("residentCareLevelField").value = resident.careLevel;
            document.getElementById("residentTagsField").value = resident.tags.join(", ");
        }
        var permissions = resident ? getResidentPermissions(resident) : defaultResidentPermissions();
        document.getElementById("residentPermReportsField").checked = permissions.dailyReports;
        document.getElementById("residentPermAppointmentsField").checked = permissions.appointments;
        document.getElementById("residentPermSchedulesField").checked = permissions.staffSchedules;
        document.getElementById("residentPermHealthField").checked = permissions.healthAttachments;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("residentModal")).show();
    }

    function openUserModal(user) {
        document.getElementById("userForm").reset();
        setFormError("userFormError", "");
        document.getElementById("userIdField").value = user ? user.id : "";
        document.getElementById("userModalTitle").textContent = user ? "Edit User" : "Add User";
        document.getElementById("userStatusField").value = user ? user.status : "Active";
        document.getElementById("userPasswordField").value = "123456";
        if (user) {
            document.getElementById("userNameField").value = user.name;
            document.getElementById("userUsernameField").value = user.username || "";
            document.getElementById("userPhoneField").value = user.phone;
            document.getElementById("userRoleField").value = user.role;
            document.getElementById("userDepartmentField").value = user.department;
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById("userModal")).show();
    }

    function openAssignmentModal(user) {
        if (!canAssignResident(user)) {
            toast("Only staff accounts can be assigned to residents.");
            return;
        }
        document.getElementById("assignmentForm").reset();
        setFormError("assignmentFormError", "");
        document.getElementById("assignmentUserIdField").value = user.id;
        document.getElementById("assignmentUserName").textContent = user.name;
        document.getElementById("assignmentUserRole").textContent = user.role + " - " + (user.department || "CareBridge");
        document.getElementById("assignmentResidentField").innerHTML = residentOptions(state.selectedResidentId);
        document.getElementById("assignmentResponsibilityField").innerHTML = renderResponsibilityOptions(user);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("assignmentModal")).show();
    }

    function openBindingModal(user) {
        if (!canBindResident(user)) {
            toast("Only Family Member accounts can be bound to residents.");
            return;
        }
        document.getElementById("bindingForm").reset();
        setFormError("bindingFormError", "");
        document.getElementById("bindingUserIdField").value = user.id;
        document.getElementById("bindingUserName").textContent = user.name;
        document.getElementById("bindingUserRole").textContent = user.role + " - " + (user.department || "Family Portal");
        document.getElementById("bindingResidentField").innerHTML = residentOptions(state.selectedResidentId);
        document.getElementById("bindingRelationshipField").value = "Family";
        document.getElementById("bindingPrimaryField").checked = false;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("bindingModal")).show();
    }

    function openFamilyAccountModal() {
        document.getElementById("familyAccountForm").reset();
        setFormError("familyAccountFormError", "");
        document.getElementById("familyAccountRelationshipField").value = "Family";
        document.getElementById("familyAccountPasswordField").value = "123456";
        bootstrap.Modal.getOrCreateInstance(document.getElementById("familyAccountModal")).show();
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

    function collectResidentPayload(existing) {
        var doctorAccountIds = selectedValues("residentDoctorField");
        return {
            name: valueOf("residentNameField"),
            gender: valueOf("residentGenderField"),
            age: Number(valueOf("residentAgeField")),
            room: valueOf("residentRoomField"),
            bed: valueOf("residentBedField"),
            floor: valueOf("residentFloorField"),
            careLevel: valueOf("residentCareLevelField"),
            tags: splitTags(valueOf("residentTagsField")),
            status: valueOf("residentStatusField"),
            admissionDate: valueOf("residentAdmissionField"),
            birthdate: valueOf("residentBirthdateField"),
            hometown: valueOf("residentHometownField"),
            emergencyContact: valueOf("residentEmergencyField"),
            familyAccountId: valueOf("residentFamilyAccountField"),
            familyRelationship: valueOf("residentFamilyRelationshipField"),
            caregiverAccountId: valueOf("residentCaregiverField"),
            nurseAccountId: valueOf("residentNurseField"),
            doctorAccountId: doctorAccountIds[0] || "",
            doctorAccountIds: doctorAccountIds,
            supervisorAccountId: valueOf("residentSupervisorField"),
            activityStaffAccountId: valueOf("residentActivityStaffField"),
            permissions: {
                dailyReports: document.getElementById("residentPermReportsField").checked,
                appointments: document.getElementById("residentPermAppointmentsField").checked,
                staffSchedules: document.getElementById("residentPermSchedulesField").checked,
                healthAttachments: document.getElementById("residentPermHealthField").checked
            }
        };
    }

    async function saveResidentForm() {
        var id = document.getElementById("residentIdField").value;
        var payload = collectResidentPayload(getResident(id));
        try {
            setFormError("residentFormError", "");
            var response = await apiRequest(id ? "/api/personnel/residents/" + encodeURIComponent(id) : "/api/personnel/residents", {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            state.selectedResidentId = response.resident.id;
            bootstrap.Modal.getInstance(document.getElementById("residentModal")).hide();
            await syncPersonnelData({ silent: true });
            toast("Resident profile saved.");
        } catch (error) {
            setFormError("residentFormError", error.message);
            toast(error.message);
        }
    }

    async function saveUserForm() {
        var id = document.getElementById("userIdField").value;
        var payload = {
            username: valueOf("userUsernameField"),
            name: valueOf("userNameField"),
            phone: valueOf("userPhoneField"),
            password: valueOf("userPasswordField") || "123456",
            role: valueOf("userRoleField"),
            department: valueOf("userDepartmentField") || "CareBridge",
            status: valueOf("userStatusField")
        };
        try {
            setFormError("userFormError", "");
            await apiRequest(id ? "/api/personnel/accounts/" + encodeURIComponent(id) : "/api/personnel/accounts", {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            bootstrap.Modal.getInstance(document.getElementById("userModal")).hide();
            await syncPersonnelData({ silent: true });
            toast("User account saved.");
        } catch (error) {
            setFormError("userFormError", error.message);
            toast(error.message);
        }
    }

    async function saveAssignmentForm() {
        var userId = valueOf("assignmentUserIdField");
        var payload = {
            residentId: valueOf("assignmentResidentField"),
            responsibility: valueOf("assignmentResponsibilityField")
        };
        try {
            setFormError("assignmentFormError", "");
            await apiRequest("/api/personnel/accounts/" + encodeURIComponent(userId) + "/assignments", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            bootstrap.Modal.getInstance(document.getElementById("assignmentModal")).hide();
            await syncPersonnelData({ silent: true });
            renderUsers();
            toast("Resident assignment saved.");
        } catch (error) {
            setFormError("assignmentFormError", error.message);
            toast(error.message);
        }
    }

    async function removeUserAssignment(userId, assignmentId) {
        if (!confirmAction("Remove this resident assignment?")) {
            return;
        }
        try {
            await apiRequest("/api/personnel/accounts/" + encodeURIComponent(userId) + "/assignments/" + encodeURIComponent(assignmentId), {
                method: "DELETE"
            });
            await syncPersonnelData({ silent: true });
            renderUsers();
            toast("Resident assignment removed.");
        } catch (error) {
            toast(error.message);
        }
    }

    async function saveBindingForm() {
        var userId = valueOf("bindingUserIdField");
        var payload = {
            residentId: valueOf("bindingResidentField"),
            relationship: valueOf("bindingRelationshipField") || "Family",
            primary: document.getElementById("bindingPrimaryField").checked
        };
        try {
            setFormError("bindingFormError", "");
            await apiRequest("/api/personnel/accounts/" + encodeURIComponent(userId) + "/family-bindings", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            bootstrap.Modal.getInstance(document.getElementById("bindingModal")).hide();
            await syncPersonnelData({ silent: true });
            renderUsers();
            toast("Family binding saved.");
        } catch (error) {
            setFormError("bindingFormError", error.message);
            toast(error.message);
        }
    }

    async function removeUserBinding(userId, bindingId) {
        if (!confirmAction("Unbind this family account from the resident?")) {
            return;
        }
        try {
            await apiRequest("/api/personnel/accounts/" + encodeURIComponent(userId) + "/family-bindings/" + encodeURIComponent(bindingId), {
                method: "DELETE"
            });
            await syncPersonnelData({ silent: true });
            renderUsers();
            toast("Family binding removed.");
        } catch (error) {
            toast(error.message);
        }
    }

    async function saveFamilyAccountForm() {
        var payload = {
            name: valueOf("familyAccountNameField"),
            username: valueOf("familyAccountUsernameField"),
            phone: valueOf("familyAccountPhoneField"),
            password: valueOf("familyAccountPasswordField") || "123456",
            relationship: valueOf("familyAccountRelationshipField") || "Family",
            role: "Family Member"
        };
        try {
            setFormError("familyAccountFormError", "");
            await apiRequest("/api/personnel/me/family-accounts", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            bootstrap.Modal.getInstance(document.getElementById("familyAccountModal")).hide();
            await syncPersonnelData({ silent: true });
            toast("Family account created and bound.");
        } catch (error) {
            setFormError("familyAccountFormError", error.message);
            toast(error.message);
        }
    }

    async function deleteSelfFamilyAccount(bindingId) {
        if (!confirmAction("Delete this family account binding?")) {
            return;
        }
        try {
            await apiRequest("/api/personnel/me/family-bindings/" + encodeURIComponent(bindingId), {
                method: "DELETE"
            });
            await syncPersonnelData({ silent: true });
            toast("Family account removed.");
        } catch (error) {
            toast(error.message);
        }
    }

    async function addSelfFriend() {
        var friendResidentId = valueOf("selfFriendCandidateField");
        if (!friendResidentId) {
            toast("No resident is available to add.");
            return;
        }
        try {
            await apiRequest("/api/personnel/me/friends", {
                method: "POST",
                body: JSON.stringify({ friendResidentId: friendResidentId })
            });
            await syncPersonnelData({ silent: true });
            toast("Friend added.");
        } catch (error) {
            toast(error.message);
        }
    }

    async function deleteSelfFriend(friendshipId) {
        if (!confirmAction("Delete this friend from your network?")) {
            return;
        }
        try {
            await apiRequest("/api/personnel/me/friends/" + encodeURIComponent(friendshipId), {
                method: "DELETE"
            });
            await syncPersonnelData({ silent: true });
            toast("Friend removed.");
        } catch (error) {
            toast(error.message);
        }
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

    function openGraphMessage(residentId) {
        var resident = getResident(residentId);
        if (!resident) {
            toast("No resident context is available for this node.");
            return;
        }
        var conversation = state.conversations.find(function (item) {
            return item.residentId === residentId && item.status !== "archived";
        });
        if (!conversation) {
            conversation = createQuickConversation(resident);
        }
        state.activeConversationId = conversation.id;
        state.selectedResidentId = residentId;
        filters.conversationSearch = "";
        addAudit("Opened graph message shortcut", resident.name);
        saveState();
        navigateToView("conversationDetail");
        toast("Message thread opened for " + resident.name + ".");
    }

    function createQuickConversation(resident) {
        var conversation = {
            id: nextId("c", state.conversations),
            residentId: resident.id,
            type: "Personnel quick message",
            title: "Message about " + resident.name,
            status: "active",
            unread: 0,
            messages: [
                {
                    sender: currentActorName(),
                    role: currentActorRole(),
                    content: "Started a quick message from the personnel relationship graph.",
                    time: new Date().toISOString(),
                    outgoing: true
                }
            ]
        };
        state.conversations.push(conversation);
        return conversation;
    }

    function currentActorName() {
        return state.currentUser && state.currentUser.name ? state.currentUser.name : (state.role === "Family" ? "Olivia Chen" : "Grace Turner");
    }

    function currentActorRole() {
        return state.currentUser && state.currentUser.role ? state.currentUser.role : state.role;
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

    function pruneResidentDemoData(id) {
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
    }

    async function deleteResident(id) {
        var resident = getResident(id);
        if (!resident) {
            return;
        }
        if (state.residents.length <= 1) {
            toast("At least one resident is required.");
            return;
        }
        try {
            var impactResponse = await apiRequest("/api/personnel/residents/" + encodeURIComponent(id) + "/delete-impact");
            var impact = impactResponse.impact || {};
            if (!confirmAction(residentDeleteConfirmationMessage(resident, impact))) {
                return;
            }
            var deleteResponse = await apiRequest("/api/personnel/residents/" + encodeURIComponent(id), { method: "DELETE" });
            pruneResidentDemoData(id);
            await syncPersonnelData({ silent: true });
            toast(residentDeleteToast(deleteResponse.impact || impact));
        } catch (error) {
            toast(error.message);
        }
    }

    async function deleteUser(id) {
        var user = getUser(id);
        if (!user) {
            return;
        }
        if (state.users.length <= 1) {
            toast("At least one account is required.");
            return;
        }
        if (!confirmAction(accountDeleteConfirmationMessage(user))) {
            return;
        }
        try {
            await apiRequest("/api/personnel/accounts/" + encodeURIComponent(id), { method: "DELETE" });
            await syncPersonnelData({ silent: true });
            toast("User account deleted.");
        } catch (error) {
            toast(error.message);
        }
    }

    function residentDeleteConfirmationMessage(resident, impact) {
        var portalAccounts = impact.residentPortalAccounts || [];
        var familyAccountsToDelete = impact.familyAccountsToDelete || [];
        var familyAccountsToUnbindOnly = impact.familyAccountsToUnbindOnly || [];
        var lines = [
            "Delete resident profile: " + resident.name + "?",
            "",
            "Database cleanup will happen automatically:",
            "- Resident profile and resident friendship edges will be deleted.",
            "- Staff assignment rows removed: " + String(impact.staffAssignmentCount || 0) + ".",
            "- Local demo schedules, conversations, reports, care records, and inquiries for this resident will be removed from this browser."
        ];
        if (portalAccounts.length) {
            lines.push("- Elderly Resident portal account deleted: " + impactNames(portalAccounts) + ".");
        } else {
            lines.push("- No Elderly Resident portal account is linked.");
        }
        if (familyAccountsToDelete.length) {
            lines.push("- Family account(s) deleted because they are only bound to this resident: " + impactNames(familyAccountsToDelete) + ".");
        } else {
            lines.push("- No exclusive family account will be deleted.");
        }
        if (familyAccountsToUnbindOnly.length) {
            lines.push("- Family account(s) kept because they are also bound to another resident: " + impactNames(familyAccountsToUnbindOnly) + ".");
        }
        lines.push("- Doctor, nurse, caregiver, and supervisor accounts are kept; only their assignment rows are removed.");
        lines.push("");
        lines.push("Continue?");
        return lines.join("\n");
    }

    function accountDeleteConfirmationMessage(user) {
        var lines = ["Delete account record: " + user.name + " (" + user.role + ")?", ""];
        if (user.role === "Elderly Resident") {
            lines.push("This removes the resident portal login account only. The resident profile remains unless it is deleted from Resident Profiles.");
        } else if (user.role === "Family Member") {
            lines.push("Family access links for this account will be removed automatically.");
            lines.push("If this account is the primary family contact, another linked family contact will be promoted when available.");
        } else if (user.role !== "Admin") {
            lines.push("Care team assignments for this account will be removed automatically.");
            lines.push("Resident profiles remain and may show missing staff coverage until reassigned.");
        } else {
            lines.push("Admin access for this account will be removed.");
        }
        lines.push("");
        lines.push("Continue?");
        return lines.join("\n");
    }

    function residentDeleteToast(impact) {
        var deletedAccountCount = (impact.residentPortalAccounts || []).length + (impact.familyAccountsToDelete || []).length;
        return "Resident deleted. Removed " + deletedAccountCount + " linked portal/family account(s).";
    }

    function impactNames(items) {
        return items.map(function (item) {
            return item.name + (item.username ? " (" + item.username + ")" : "");
        }).join(", ");
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
        var inquiry = state.inquiries.find(function (item) {
            return item.conversationId === id;
        });
        if (inquiry && inquiry.status !== "Closed") {
            inquiry.status = "Closed";
        }
        if (state.activeConversationId === id) {
            var nextConversation = state.conversations.find(function (item) {
                return item.status !== "archived";
            });
            state.activeConversationId = nextConversation ? nextConversation.id : "";
        }
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

    async function toggleUserStatus(id) {
        var user = getUser(id);
        if (!user) {
            return;
        }
        var status = user.status === "Active" ? "Frozen" : "Active";
        try {
            await apiRequest("/api/personnel/accounts/" + encodeURIComponent(id) + "/status", {
                method: "PATCH",
                body: JSON.stringify({ status: status })
            });
            await syncPersonnelData({ silent: true });
            toast("User status updated.");
        } catch (error) {
            toast(error.message);
        }
    }

    async function updateResidentPermission(key, checked) {
        var resident = getResident(state.selectedResidentId);
        if (!resident) {
            return;
        }
        var permissions = getResidentPermissions(resident);
        permissions[key] = checked;
        try {
            await apiRequest("/api/personnel/residents/" + encodeURIComponent(resident.id) + "/permissions", {
                method: "PATCH",
                body: JSON.stringify({ permissions: permissions })
            });
            await syncPersonnelData({ silent: true });
            toast("Permission setting saved.");
        } catch (error) {
            toast(error.message);
            await syncPersonnelData({ silent: true });
        }
    }

    function handleElderlyAction(label) {
        var resident = getResident(state.selectedResidentId);
        toast((label || "Action") + " is recorded as a demo action for " + (resident ? resident.name : "the resident") + ".");
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

    function latestHealthObservation(residentId) {
        return state.observations.filter(function (observation) {
            return observation.residentId === residentId;
        }).sort(function (a, b) {
            return new Date(a.time) - new Date(b.time);
        }).slice(-1)[0];
    }

    function openInquiries() {
        return state.inquiries.filter(function (item) {
            return isOpenInquiry(item.status);
        });
    }

    function isOpenInquiry(status) {
        return status === "Pending" || status === "Processing" || status === "Supervisor Review";
    }

    function pendingAppointmentCount() {
        return state.appointments.filter(function (item) {
            return item.status === "Pending";
        }).length;
    }

    function unreadConversationCount() {
        return state.conversations.reduce(function (total, conversation) {
            if (conversation.status === "archived") {
                return total;
            }
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

    function canManagePersonnel() {
        return Boolean(state.currentUser && state.currentUser.role === "Admin");
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

    function selectedValues(id) {
        var element = document.getElementById(id);
        if (!element) {
            return [];
        }
        return Array.prototype.map.call(element.selectedOptions || [], function (option) {
            return option.value;
        }).filter(Boolean);
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
