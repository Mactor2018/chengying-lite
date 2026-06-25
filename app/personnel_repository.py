# -*- encoding: utf-8 -*-

from contextlib import contextmanager
from datetime import date, datetime
from math import cos, radians, sin

from mysql.connector import Error as MySQLError
from mysql.connector import errorcode

from app.db import DatabaseUnavailable, get_connection


class ValidationError(Exception):
    pass


class NotFoundError(Exception):
    pass


class ConflictError(Exception):
    pass


STAFF_RESPONSIBILITIES = {
    "caregiver": "maincaregiver",
    "nurse": "nurse",
    "doctor": "doctor",
    "supervisor": "supervisor",
    "activityStaff": "activitystaff",
}
STAFF_RESIDENT_ROLES = {"Nursing Supervisor", "Nurse", "Doctor", "Caregiver", "Activity Staff"}
UNIQUE_STAFF_RESPONSIBILITIES = {"nurse", "supervisor"}
MULTI_STAFF_RESPONSIBILITIES = {"doctor", "maincaregiver", "activitystaff"}
ROLE_ASSIGNMENT_OPTIONS = {
    "Nursing Supervisor": {"supervisor"},
    "Nurse": {"nurse"},
    "Doctor": {"doctor"},
    "Caregiver": {"maincaregiver", "activitystaff"},
    "Activity Staff": {"activitystaff"},
}
ASSIGNMENT_LABELS = {
    "maincaregiver": "Caregiver",
    "nurse": "Primary nurse",
    "doctor": "Doctor",
    "supervisor": "Nurse manager",
    "activitystaff": "Activity staff",
}


def parse_prefixed_id(value, prefix):
    if value is None or value == "":
        return None
    value = str(value)
    if value.startswith(prefix):
        value = value[len(prefix):]
    try:
        parsed = int(value)
    except ValueError as error:
        raise ValidationError(f"Invalid id: {value}") from error
    if parsed <= 0:
        raise ValidationError(f"Invalid id: {value}")
    return parsed


def account_public_id(account_id):
    return f"u{account_id}" if account_id else ""


def resident_public_id(resident_id):
    return f"r{resident_id}" if resident_id else ""


def iso_date(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()[:10]
    return str(value) if value is not None else ""


def split_tags(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def bool_to_int(value):
    return 1 if bool(value) else 0


@contextmanager
def connection_scope():
    connection = get_connection()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def fetch_all(cursor, sql, params=None):
    cursor.execute(sql, params or ())
    return cursor.fetchall()


def fetch_one(cursor, sql, params=None):
    cursor.execute(sql, params or ())
    return cursor.fetchone()


def validate_required(payload, fields):
    missing = [field for field in fields if payload.get(field) in (None, "")]
    if missing:
        raise ValidationError("Missing required fields: " + ", ".join(missing))


def permissions_from_binding(binding):
    if not binding:
        return {
            "dailyReports": True,
            "appointments": True,
            "staffSchedules": False,
            "healthAttachments": False,
        }
    return {
        "dailyReports": bool(binding["reportflag"]),
        "appointments": bool(binding["appointmentflag"]),
        "staffSchedules": bool(binding["staffscheduleflag"]),
        "healthAttachments": bool(binding["healthattachmentflag"]),
    }


def list_accounts(cursor):
    rows = fetch_all(cursor, "SELECT * FROM account ORDER BY accountid")
    related = account_resident_links(cursor)
    assignments = account_staff_assignment_links(cursor)
    family_bindings = account_family_binding_links(cursor)
    return [
        serialize_account(
            row,
            related.get(row["accountid"], []),
            assignments.get(row["accountid"], []),
            family_bindings.get(row["accountid"], []),
        )
        for row in rows
    ]


def account_resident_links(cursor):
    links = {}
    binding_rows = fetch_all(cursor, "SELECT accountid, residentid FROM familybinding")
    resident_account_rows = fetch_all(cursor, "SELECT accountid, residentid FROM residentaccount")
    assignment_rows = fetch_all(
        cursor,
        "SELECT accountid, residentid FROM staffassignment WHERE assignstatus = 'Active'",
    )
    for row in binding_rows + resident_account_rows + assignment_rows:
        links.setdefault(row["accountid"], set()).add(resident_public_id(row["residentid"]))
    return {account_id: sorted(resident_ids) for account_id, resident_ids in links.items()}


def account_staff_assignment_links(cursor):
    rows = fetch_all(
        cursor,
        """
        SELECT sa.assignid, sa.accountid, sa.residentid, sa.responsibility, sa.assignstatus,
               r.fullname AS residentname, r.roomnumber, r.carelevel
        FROM staffassignment sa
        JOIN resident r ON r.residentid = sa.residentid
        WHERE sa.assignstatus = 'Active'
        ORDER BY r.fullname, sa.responsibility, sa.assignid
        """,
    )
    result = {}
    for row in rows:
        result.setdefault(row["accountid"], []).append({
            "assignmentId": row["assignid"],
            "residentId": resident_public_id(row["residentid"]),
            "residentDbId": row["residentid"],
            "residentName": row["residentname"],
            "room": row["roomnumber"],
            "careLevel": row["carelevel"],
            "responsibility": row["responsibility"],
            "label": ASSIGNMENT_LABELS.get(row["responsibility"], row["responsibility"]),
            "status": row["assignstatus"],
        })
    return result


def serialize_family_binding(row):
    return {
        "bindingId": row["bindingid"],
        "residentId": resident_public_id(row["residentid"]),
        "residentDbId": row["residentid"],
        "residentName": row.get("residentname") or "",
        "room": row.get("roomnumber") or "",
        "careLevel": row.get("carelevel") or "",
        "accountId": account_public_id(row["accountid"]),
        "accountDbId": row["accountid"],
        "accountName": row.get("familyname") or row.get("accountname") or "",
        "relationship": row["relationship"],
        "primary": bool(row["primaryflag"]),
        "emergency": bool(row["emergencyflag"]),
        "permissions": permissions_from_binding(row),
    }


def account_family_binding_links(cursor):
    rows = fetch_all(
        cursor,
        """
        SELECT fb.*, r.fullname AS residentname, r.roomnumber, r.carelevel,
               a.fullname AS familyname
        FROM familybinding fb
        JOIN resident r ON r.residentid = fb.residentid
        JOIN account a ON a.accountid = fb.accountid
        ORDER BY r.fullname, fb.primaryflag DESC, fb.bindingid
        """,
    )
    result = {}
    for row in rows:
        result.setdefault(row["accountid"], []).append(serialize_family_binding(row))
    return result


def family_bindings_by_resident(cursor):
    rows = fetch_all(
        cursor,
        """
        SELECT fb.*, a.fullname AS familyname, a.accountid AS familyaccountid,
               a.phone AS familyphone, a.accountstatus AS familystatus,
               r.fullname AS residentname, r.roomnumber, r.carelevel
        FROM familybinding fb
        JOIN account a ON a.accountid = fb.accountid
        JOIN resident r ON r.residentid = fb.residentid
        ORDER BY fb.primaryflag DESC, fb.bindingid
        """,
    )
    result = {}
    for row in rows:
        result.setdefault(row["residentid"], []).append(row)
    return result


def serialize_account(row, resident_ids=None, assignments=None, family_bindings=None):
    return {
        "id": account_public_id(row["accountid"]),
        "accountId": row["accountid"],
        "username": row.get("username") or "",
        "name": row["fullname"],
        "phone": row["phone"],
        "role": row["rolename"],
        "title": row["rolename"],
        "department": row["department"] or "",
        "status": row["accountstatus"],
        "residents": resident_ids or [],
        "assignments": assignments or [],
        "familyBindings": family_bindings or [],
    }


def list_residents(cursor):
    residents = fetch_all(cursor, "SELECT * FROM resident ORDER BY residentid")
    bindings = family_bindings_by_resident(cursor)
    assignments = staff_assignments_by_resident(cursor)
    return [
        serialize_resident(
            row,
            (bindings.get(row["residentid"]) or [None])[0],
            assignments.get(row["residentid"], {}),
            bindings.get(row["residentid"], []),
        )
        for row in residents
    ]


def serialize_resident_by_id(cursor, resident_id):
    row = ensure_resident(cursor, resident_id)
    bindings = family_bindings_by_resident(cursor).get(resident_id, [])
    return serialize_resident(
        row,
        (bindings or [None])[0],
        staff_assignments_by_resident(cursor).get(resident_id, {}),
        bindings,
    )


def primary_bindings_by_resident(cursor):
    rows = fetch_all(
        cursor,
        """
        SELECT fb.*, a.fullname AS familyname, a.accountid AS familyaccountid
        FROM familybinding fb
        JOIN account a ON a.accountid = fb.accountid
        ORDER BY fb.primaryflag DESC, fb.bindingid
        """,
    )
    result = {}
    for row in rows:
        result.setdefault(row["residentid"], row)
    return result


def staff_assignments_by_resident(cursor):
    rows = fetch_all(
        cursor,
        """
        SELECT sa.residentid, sa.responsibility, a.accountid, a.fullname
        , a.rolename, a.department, a.accountstatus
        FROM staffassignment sa
        JOIN account a ON a.accountid = sa.accountid
        WHERE sa.assignstatus = 'Active'
        ORDER BY sa.assignid
        """,
    )
    result = {}
    for row in rows:
        resident_assignments = result.setdefault(row["residentid"], {})
        if row["responsibility"] in MULTI_STAFF_RESPONSIBILITIES:
            resident_assignments.setdefault(row["responsibility"], []).append(row)
        else:
            resident_assignments[row["responsibility"]] = row
    return result


def account_summary(row):
    return {
        "id": account_public_id(row["accountid"]),
        "accountId": row["accountid"],
        "name": row["fullname"],
        "role": row["rolename"],
        "title": row["rolename"],
        "department": row["department"] or "",
        "status": row["accountstatus"],
    }


def listify_assignment(value):
    if not value:
        return []
    return value if isinstance(value, list) else [value]


def serialize_resident(row, binding=None, assignments=None, family_bindings=None):
    assignments = assignments or {}
    caregivers = listify_assignment(assignments.get("maincaregiver"))
    caregiver = caregivers[0] if caregivers else None
    nurse = assignments.get("nurse")
    doctors = listify_assignment(assignments.get("doctor"))
    doctor = doctors[0] if doctors else None
    supervisor = assignments.get("supervisor")
    activity_staff = listify_assignment(assignments.get("activitystaff"))
    activity = activity_staff[0] if activity_staff else None
    family_bindings = family_bindings or ([binding] if binding else [])
    family_name = binding["familyname"] if binding else (row["emergencycontact"] or "")
    return {
        "id": resident_public_id(row["residentid"]),
        "residentId": row["residentid"],
        "name": row["fullname"],
        "gender": row["gender"],
        "age": row["age"],
        "birthdate": iso_date(row.get("birthdate")),
        "hometown": row.get("hometown") or "",
        "room": row["roomnumber"],
        "bed": row["bednumber"],
        "floor": row["floorname"],
        "careLevel": row["carelevel"],
        "tags": split_tags(row["healthtags"]),
        "status": row["residentstatus"],
        "admissionDate": iso_date(row["admissiondate"]),
        "primaryFamily": family_name,
        "familyAccountId": account_public_id(binding["familyaccountid"]) if binding else "",
        "familyRelationship": binding["relationship"] if binding else "",
        "emergencyContact": row["emergencycontact"] or family_name,
        "caregiver": ", ".join([item["fullname"] for item in caregivers]),
        "caregiverAccountId": account_public_id(caregiver["accountid"]) if caregiver else "",
        "caregivers": [account_summary(item) for item in caregivers],
        "nurse": nurse["fullname"] if nurse else "",
        "nurseAccountId": account_public_id(nurse["accountid"]) if nurse else "",
        "doctor": ", ".join([doctor_row["fullname"] for doctor_row in doctors]),
        "doctorAccountId": account_public_id(doctor["accountid"]) if doctor else "",
        "doctors": [account_summary(doctor_row) for doctor_row in doctors],
        "supervisor": supervisor["fullname"] if supervisor else "",
        "supervisorAccountId": account_public_id(supervisor["accountid"]) if supervisor else "",
        "activityStaff": ", ".join([item["fullname"] for item in activity_staff]),
        "activityStaffAccountId": account_public_id(activity["accountid"]) if activity else "",
        "activityStaffMembers": [account_summary(item) for item in activity_staff],
        "familyBindings": [serialize_family_binding(item) for item in family_bindings],
        "tone": tone_for_resident(row["residentid"]),
        "permissions": permissions_from_binding(binding),
    }


def tone_for_resident(resident_id):
    tones = ["tone-resident", "tone-resident", "tone-resident", "tone-resident"]
    return tones[(resident_id - 1) % len(tones)]


def bootstrap_data(account_id=None):
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        all_residents = list_residents(cursor)
        all_users = list_accounts(cursor)
        current_user = resolve_current_user(cursor, account_id, all_users)
        if not current_user:
            raise ValidationError("Login required")
        if current_user["status"] != "Active":
            raise ConflictError("This account is frozen or inactive")
        residents = shape_residents_for_user(
            current_user,
            scope_residents_for_user(cursor, current_user, all_residents),
        )
        users = scope_users_for_user(cursor, current_user, all_users, residents)
        graph_bundle = build_personnel_graphs(cursor, current_user, residents, users, all_residents)
        return {
            "residents": residents,
            "users": users,
            "currentUser": current_user,
            "graphViews": graph_bundle["views"],
            "defaultGraphView": graph_bundle["defaultView"],
            "graphs": graph_bundle["graphs"],
            "options": {
                "careLevels": sorted({resident["careLevel"] for resident in residents}),
                "roles": sorted({user["role"] for user in users}),
                "friendCandidates": friend_candidate_options(cursor, current_user, all_residents),
                "friends": friend_records_for_current_user(cursor, current_user, all_residents),
            },
            "stats": personnel_stats(residents, users),
        }


def shape_residents_for_user(current_user, residents):
    return [shape_resident_for_user(current_user, resident) for resident in residents]


def shape_resident_for_user(current_user, resident):
    role = current_user["role"] if current_user else ""
    shaped = dict(resident)
    shaped["tags"] = list(resident.get("tags") or [])
    shaped["caregivers"] = [dict(item) for item in resident.get("caregivers") or []]
    shaped["doctors"] = [dict(item) for item in resident.get("doctors") or []]
    shaped["activityStaffMembers"] = [dict(item) for item in resident.get("activityStaffMembers") or []]
    shaped["permissions"] = dict(resident.get("permissions") or {})
    bindings = [dict(item) for item in resident.get("familyBindings") or []]

    if role == "Family Member":
        bindings = [binding for binding in bindings if binding.get("accountId") == current_user["id"]]
        if bindings:
            binding = bindings[0]
            shaped["primaryFamily"] = binding.get("accountName") or current_user["name"]
            shaped["familyAccountId"] = binding.get("accountId") or current_user["id"]
            shaped["familyRelationship"] = binding.get("relationship") or "Family"
            shaped["permissions"] = dict(binding.get("permissions") or {})
        else:
            shaped["primaryFamily"] = current_user["name"]
            shaped["familyAccountId"] = current_user["id"]
            shaped["familyRelationship"] = "Family"
    elif role not in ("Admin", "Nursing Supervisor", "Elderly Resident"):
        bindings = []

    shaped["familyBindings"] = bindings
    return shaped


def scope_users_for_user(cursor, current_user, users, residents):
    if current_user["role"] == "Admin":
        return users
    visible_ids = {current_user["id"]}
    portal_accounts = resident_portal_accounts(cursor)
    for resident in residents:
        for account_id, _label, _edge_type, _badge in resident_relation_links(resident, portal_accounts, current_user):
            visible_ids.add(account_id)
    return [
        shape_account_for_user(user, current_user)
        for user in users
        if user["id"] in visible_ids
    ]


def shape_account_for_user(account, current_user):
    if current_user["role"] == "Admin":
        return account
    shaped = {
        "id": account["id"],
        "accountId": account["accountId"],
        "username": account["username"] if account["id"] == current_user["id"] else "",
        "name": account["name"],
        "phone": account["phone"] if account["id"] == current_user["id"] else "",
        "role": account["role"],
        "title": account.get("title") or account["role"],
        "department": account.get("department") or "",
        "status": account["status"],
        "residents": list(account.get("residents") or []),
        "assignments": [],
        "familyBindings": [],
    }
    if account["id"] == current_user["id"] or current_user["role"] == "Nursing Supervisor":
        shaped["assignments"] = [dict(item) for item in account.get("assignments") or []]
        shaped["familyBindings"] = [dict(item) for item in account.get("familyBindings") or []]
    return shaped


def list_residents_for_account(account_id=None):
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        residents = list_residents(cursor)
        users = list_accounts(cursor)
        current_user = resolve_current_user(cursor, account_id, users)
        return scope_residents_for_user(cursor, current_user, residents)


def scope_residents_for_user(cursor, current_user, residents):
    if not current_user:
        return []
    if current_user["role"] == "Admin":
        return residents
    return visible_residents(cursor, current_user, residents)


def can_view_resident_id(cursor, current_user, resident_id):
    if not current_user:
        return False
    if current_user["role"] == "Admin":
        return True
    account_id = current_user["accountId"]
    role = current_user["role"]
    if role in STAFF_RESIDENT_ROLES:
        return bool(fetch_one(
            cursor,
            """
            SELECT 1
            FROM staffassignment
            WHERE accountid = %s AND residentid = %s AND assignstatus = 'Active'
            LIMIT 1
            """,
            (account_id, resident_id),
        ))
    if role == "Family Member":
        return bool(fetch_one(
            cursor,
            "SELECT 1 FROM familybinding WHERE accountid = %s AND residentid = %s LIMIT 1",
            (account_id, resident_id),
        ))
    if role == "Elderly Resident":
        return bool(fetch_one(
            cursor,
            "SELECT 1 FROM residentaccount WHERE accountid = %s AND residentid = %s LIMIT 1",
            (account_id, resident_id),
        ))
    return False


def personnel_stats(residents, users):
    return {
        "residentCount": len(residents),
        "accountCount": len(users),
        "activeStaffCount": len([
            user for user in users
            if user["status"] == "Active" and user["role"] not in ("Family Member", "Elderly Resident")
        ]),
        "frozenAccountCount": len([user for user in users if user["status"] == "Frozen"]),
    }


def resolve_current_user(cursor, account_id, users):
    if not account_id:
        return None
    if account_id:
        row = fetch_one(cursor, "SELECT * FROM account WHERE accountid = %s", (account_id,))
        if row:
            return serialize_account_by_id(cursor, row["accountid"])
    return None


def graph_node(node_id, node_type, label, subtitle, badge, x, y, details=None, tone=""):
    return {
        "id": node_id,
        "type": node_type,
        "label": label,
        "subtitle": subtitle,
        "badge": badge,
        "x": x,
        "y": y,
        "details": details or {},
        "tone": tone,
    }


def graph_edge(source, target, label, edge_type):
    return {
        "source": source,
        "target": target,
        "label": label,
        "type": edge_type,
    }


def account_details(account):
    return {
        "Name": account["name"],
        "Username": account.get("username") or "-",
        "Role": account["role"],
        "Department": account.get("department") or "-",
        "Title": account.get("title") or account["role"],
        "Phone": account.get("phone") or "-",
        "Status": account["status"],
    }


def resident_details(resident):
    return {
        "Name": resident["name"],
        "Birthday": resident.get("birthdate") or "-",
        "Hometown": resident.get("hometown") or "-",
        "Room": f"{resident['room']} / {resident['bed']}",
        "Care level": resident["careLevel"],
        "Status": resident["status"],
    }


def account_node(account, x, y, badge=None):
    role = account["role"]
    return graph_node(
        account["id"],
        "account",
        account["name"],
        account.get("department") or role,
        badge or role,
        x,
        y,
        account_details(account),
        tone_for_role(role),
    )


def resident_node(resident, x, y, badge="Resident"):
    return graph_node(
        resident["id"],
        "resident",
        resident["name"],
        resident.get("hometown") or resident["room"],
        badge,
        x,
        y,
        resident_details(resident),
        "tone-resident",
    )


def tone_for_role(role):
    if role == "Admin":
        return "tone-admin"
    if role == "Nursing Supervisor":
        return "tone-supervisor"
    if role == "Nurse":
        return "tone-nurse"
    if role == "Doctor":
        return "tone-doctor"
    if role == "Caregiver":
        return "tone-caregiver"
    if role == "Activity Staff":
        return "tone-activity"
    if role in ("Family Member", "Family", "Families", "Familie"):
        return "tone-family"
    if role in ("Elderly Resident", "Resident", "Residents", "Patient", "Patients"):
        return "tone-resident"
    return "tone-staff"


def unique_nodes(nodes):
    result = {}
    for node in nodes:
        result[node["id"]] = node
    return list(result.values())


def build_personnel_graphs(cursor, current_user, residents, users, all_residents=None):
    all_residents = all_residents or residents
    views = available_graph_views(current_user)
    graphs = {
        "departmentOverview": build_department_overview_graph(cursor, current_user, residents, users),
        "patientCareTeams": build_patient_care_teams_graph(cursor, current_user, residents, users),
        "nursingManagement": build_nursing_management_graph(cursor, current_user, residents, users),
        "doctorCollaboration": build_doctor_collaboration_graph(cursor, current_user, residents, users),
        "friendsNetwork": build_friends_network_graph(cursor, current_user, residents, all_residents),
    }
    default_view = views[0]["key"] if views else "departmentOverview"
    return {
        "views": views,
        "defaultView": default_view,
        "graphs": {view["key"]: graphs[view["key"]] for view in views if view["key"] in graphs},
    }


def available_graph_views(current_user):
    if not current_user:
        return [{"key": "departmentOverview", "label": "Department Overview"}]
    role = current_user["role"]
    if role == "Admin":
        return [
            {"key": "departmentOverview", "label": "Department Overview"},
            {"key": "patientCareTeams", "label": "Patient Care Teams"},
            {"key": "nursingManagement", "label": "Nursing Management"},
            {"key": "doctorCollaboration", "label": "Doctor Collaboration"},
        ]
    if role == "Nursing Supervisor":
        return [
            {"key": "departmentOverview", "label": "Department Overview"},
            {"key": "patientCareTeams", "label": "Patient Care Teams"},
            {"key": "nursingManagement", "label": "Nursing Management"},
            {"key": "doctorCollaboration", "label": "Doctor Collaboration"},
        ]
    if role == "Elderly Resident":
        return [
            {"key": "patientCareTeams", "label": "My Care Team"},
            {"key": "friendsNetwork", "label": "Friends Network"},
        ]
    if role == "Family Member":
        return [{"key": "patientCareTeams", "label": "Resident Care Team"}]
    if role == "Doctor":
        return [
            {"key": "patientCareTeams", "label": "Assigned Patients"},
            {"key": "doctorCollaboration", "label": "Doctor Collaboration"},
        ]
    if role == "Nurse":
        return [
            {"key": "patientCareTeams", "label": "Assigned Patients"},
            {"key": "nursingManagement", "label": "Nursing Team"},
        ]
    return [{"key": "patientCareTeams", "label": "Assigned Patients"}]


def users_by_public_id(users):
    return {user["id"]: user for user in users}


def users_by_db_id(users):
    return {user["accountId"]: user for user in users}


def residents_by_db_id(residents):
    return {resident["residentId"]: resident for resident in residents}


def residents_by_public_id(residents):
    return {resident["id"]: resident for resident in residents}


def visible_residents(cursor, current_user, residents):
    if not current_user:
        return residents
    role = current_user["role"]
    account_id = current_user["accountId"]
    if role == "Admin":
        return residents
    if role == "Elderly Resident":
        rows = fetch_all(cursor, "SELECT residentid FROM residentaccount WHERE accountid = %s", (account_id,))
    elif role == "Family Member":
        rows = fetch_all(cursor, "SELECT residentid FROM familybinding WHERE accountid = %s", (account_id,))
    else:
        rows = fetch_all(
            cursor,
            "SELECT residentid FROM staffassignment WHERE accountid = %s AND assignstatus = 'Active'",
            (account_id,),
        )
    visible_ids = {row["residentid"] for row in rows}
    return [resident for resident in residents if resident["residentId"] in visible_ids]


def elderly_resident_id(cursor, current_user):
    if not current_user or current_user["role"] != "Elderly Resident":
        return None
    row = fetch_one(cursor, "SELECT residentid FROM residentaccount WHERE accountid = %s LIMIT 1", (current_user["accountId"],))
    return row["residentid"] if row else None


def resident_friend_option(resident):
    return {
        "id": resident["id"],
        "residentId": resident["residentId"],
        "name": resident["name"],
        "room": resident["room"],
        "careLevel": resident["careLevel"],
        "hometown": resident.get("hometown") or "",
    }


def friend_records_for_resident(cursor, resident_id, residents):
    resident_lookup = residents_by_db_id(residents)
    rows = fetch_all(
        cursor,
        """
        SELECT friendshipid, friendresidentid, friendstatus
        FROM residentfriendship
        WHERE residentid = %s
        ORDER BY friendshipid
        """,
        (resident_id,),
    )
    records = []
    for row in rows:
        friend = resident_lookup.get(row["friendresidentid"])
        if not friend:
            continue
        record = resident_friend_option(friend)
        record.update({
            "friendshipId": row["friendshipid"],
            "status": row["friendstatus"],
        })
        records.append(record)
    return records


def friend_records_for_current_user(cursor, current_user, residents):
    resident_id = elderly_resident_id(cursor, current_user)
    if not resident_id:
        return []
    return friend_records_for_resident(cursor, resident_id, residents)


def friend_candidate_options(cursor, current_user, residents):
    resident_id = elderly_resident_id(cursor, current_user)
    if not resident_id:
        return []
    return []


def resident_portal_accounts(cursor):
    rows = fetch_all(cursor, "SELECT residentid, accountid FROM residentaccount ORDER BY residentaccountid")
    return {row["residentid"]: account_public_id(row["accountid"]) for row in rows}


def group_positions(items, positions):
    ordered = sorted(items, key=lambda item: item["id"])
    return {
        item["id"]: positions[index % len(positions)]
        for index, item in enumerate(ordered)
    }


def radial_positions(items, center_x=50, center_y=50, radius_x=38, radius_y=34, start_angle=-90):
    ordered = sorted(items, key=lambda item: item["id"])
    total = len(ordered)
    if not total:
        return {}
    return {
        item["id"]: radial_point(index, total, center_x, center_y, radius_x, radius_y, start_angle)
        for index, item in enumerate(ordered)
    }


def radial_point(index, total, center_x=50, center_y=50, radius_x=38, radius_y=34, start_angle=-90):
    angle = radians(start_angle + (360 / total) * index)
    x = center_x + radius_x * cos(angle)
    y = center_y + radius_y * sin(angle)
    return (round(max(7, min(93, x)), 2), round(max(9, min(91, y)), 2))


def resident_relation_links(resident, portal_accounts, current_user=None):
    role = current_user["role"] if current_user else ""
    links = []
    portal_account_id = portal_accounts.get(resident["residentId"])
    if portal_account_id and (
        role in ("Admin", "Nursing Supervisor") or
        (role == "Elderly Resident" and current_user and current_user["id"] == portal_account_id)
    ):
        links.append((portal_account_id, "Resident portal", "resident-account", "Portal"))
    family_bindings = resident.get("familyBindings") or []
    if family_bindings:
        for binding in family_bindings:
            links.append((
                binding["accountId"],
                binding.get("relationship") or "Family",
                "family",
                "Family",
            ))
    elif resident.get("familyAccountId") and role not in ("Family Member", "Elderly Resident"):
        links.append((
            resident["familyAccountId"],
            resident.get("familyRelationship") or "Family",
            "family",
            "Family",
        ))
    caregivers = resident.get("caregivers") or []
    if caregivers:
        for caregiver in caregivers:
            links.append((caregiver["id"], "Caregiver", "caregiver", "Caregiver"))
    elif resident.get("caregiverAccountId"):
        links.append((resident["caregiverAccountId"], "Caregiver", "caregiver", "Caregiver"))
    if resident.get("nurseAccountId"):
        links.append((resident["nurseAccountId"], "Primary nurse", "nurse", "Primary nurse"))
    if resident.get("supervisorAccountId"):
        links.append((resident["supervisorAccountId"], "Nurse manager", "supervisor", "Nurse manager"))
    activity_staff = resident.get("activityStaffMembers") or []
    if activity_staff:
        for account in activity_staff:
            links.append((account["id"], "Activity staff", "activity", "Activity"))
    elif resident.get("activityStaffAccountId"):
        links.append((resident["activityStaffAccountId"], "Activity staff", "activity", "Activity"))
    for doctor in resident.get("doctors") or []:
        links.append((doctor["id"], doctor.get("department") or "Doctor", "doctor", "Doctor"))
    return links


def build_department_overview_graph(cursor, current_user, residents, users):
    department = "Department 1 - Integrated Care Unit"
    role_counts = {}
    for user in users:
        role_counts[user["role"]] = role_counts.get(user["role"], 0) + 1
    group_rows = fetch_all(
        cursor,
        """
        SELECT ig.groupid, ig.groupname, ig.grouptype, ig.department, COUNT(gm.accountid) AS member_count
        FROM internalgroup ig
        LEFT JOIN groupmembership gm ON gm.groupid = ig.groupid
        GROUP BY ig.groupid, ig.groupname, ig.grouptype, ig.department
        ORDER BY ig.groupid
        """,
    )
    center_id = "department:department-1"
    nodes = [
        graph_node(
            center_id,
            "department",
            "Department 1",
            department,
            f"{len(residents)} patients",
            50,
            50,
            {
                "Department": department,
                "Residents": str(len(residents)),
                "Accounts": str(len(users)),
                "Groups": str(len(group_rows)),
            },
            "tone-violet",
        )
    ]
    edges = []
    role_specs = [
        ("role:Nursing Supervisor", "Nursing Supervisor", role_counts.get("Nursing Supervisor", 0)),
        ("role:Nurse", "Nurses", role_counts.get("Nurse", 0)),
        ("role:Doctor", "Doctors", role_counts.get("Doctor", 0)),
        ("role:Caregiver", "Caregivers", role_counts.get("Caregiver", 0)),
        ("role:Elderly Resident", "Residents", len(residents)),
        ("role:Family Member", "Families", role_counts.get("Family Member", 0)),
    ]
    total_outer_nodes = len(role_specs) + min(len(group_rows), 4)
    for index, (node_id, label, count) in enumerate(role_specs):
        x, y = radial_point(index, total_outer_nodes, 50, 50, 40, 36, -90)
        nodes.append(graph_node(
            node_id,
            "role",
            label,
            "Role group",
            f"{count} records",
            x,
            y,
            {"Group": label, "Records": str(count), "Source": "account/resident tables"},
            tone_for_role(label.rstrip("s")),
        ))
        edges.append(graph_edge(center_id, node_id, "contains", "department-role"))

    for index, group in enumerate(group_rows[:4]):
        x, y = radial_point(index + len(role_specs), total_outer_nodes, 50, 50, 40, 36, -90)
        node_id = "group:" + str(group["groupid"])
        nodes.append(graph_node(
            node_id,
            "group",
            group["groupname"],
            group["grouptype"],
            f"{group['member_count']} members",
            x,
            y,
            {
                "Group": group["groupname"],
                "Type": group["grouptype"],
                "Department": group.get("department") or "-",
                "Members": str(group["member_count"]),
            },
            "tone-amber",
        ))
        edges.append(graph_edge(center_id, node_id, "internal group", "internal-group"))

    return {
        "title": "Department 1 Overview",
        "summary": "Aggregated Department 1 graph from account, resident, internalgroup, and groupmembership rows.",
        "nodes": nodes,
        "edges": edges,
    }


def build_patient_care_teams_graph(cursor, current_user, residents, users):
    scoped_residents = visible_residents(cursor, current_user, residents)
    if not scoped_residents:
        return {"title": "Patient Care Teams", "summary": "No visible resident rows for this role.", "nodes": [], "edges": []}

    portal_accounts = resident_portal_accounts(cursor)
    user_lookup = users_by_public_id(users)
    single_resident = len(scoped_residents) == 1
    resident_positions = {
        scoped_residents[0]["id"]: (50, 50)
    } if single_resident else radial_positions(scoped_residents, 50, 50, 21, 18, -90)
    account_ids = []
    for resident in scoped_residents:
        account_ids.extend([link[0] for link in resident_relation_links(resident, portal_accounts, current_user)])
    linked_accounts = [user_lookup[account_id] for account_id in sorted(set(account_ids)) if account_id in user_lookup]
    account_positions = radial_positions(linked_accounts, 50, 50, 41, 36, -90)

    nodes = []
    edges = []
    if not single_resident:
        center_id = "group:patient-care-teams"
        nodes.append(graph_node(
            center_id,
            "group",
            "Care Team Network",
            "Department 1 resident-centered network",
            f"{len(scoped_residents)} patients",
            50,
            50,
            {
                "Visible patients": str(len(scoped_residents)),
                "Visible accounts": str(len(linked_accounts)),
                "Source": "residentaccount, familybinding, staffassignment",
            },
            "tone-violet",
        ))
    for resident in scoped_residents:
        x, y = resident_positions[resident["id"]]
        resident_badge = "Me" if current_user and current_user["id"] == portal_accounts.get(resident["residentId"]) else "Patient"
        nodes.append(resident_node(resident, x, y, resident_badge))
        if not single_resident:
            edges.append(graph_edge("group:patient-care-teams", resident["id"], "patient", "patient-scope"))
        for account_id, label, edge_type, badge in resident_relation_links(resident, portal_accounts, current_user):
            account = user_lookup.get(account_id)
            if not account:
                continue
            ax, ay = account_positions.get(account_id, (x, y - 24))
            nodes.append(account_node(account, ax, ay, badge))
            edges.append(graph_edge(resident["id"], account_id, label, edge_type))

    return {
        "title": "Department 1 Patient Care Teams",
        "summary": "Resident-centered teams from residentaccount, familybinding, and staffassignment rows.",
        "nodes": unique_nodes(nodes),
        "edges": edges,
    }


def build_friends_network_graph(cursor, current_user, residents, all_residents):
    visible = visible_residents(cursor, current_user, residents)
    resident = visible[0] if visible else None
    if not resident:
        return {"title": "Friends Network", "summary": "No resident rows found.", "nodes": [], "edges": []}
    resident_lookup = residents_by_db_id(all_residents)
    rows = fetch_all(
        cursor,
        "SELECT friendresidentid, friendstatus FROM residentfriendship WHERE residentid = %s ORDER BY friendshipid",
        (resident["residentId"],),
    )
    friend_rows = [row for row in rows if resident_lookup.get(row["friendresidentid"])]
    friend_positions = radial_positions(
        [resident_lookup[row["friendresidentid"]] for row in friend_rows],
        50,
        50,
        37,
        34,
        -90,
    )
    nodes = [resident_node(resident, 50, 50, "Me")]
    edges = []
    for row in friend_rows:
        friend = resident_lookup.get(row["friendresidentid"])
        if not friend:
            continue
        x, y = friend_positions[friend["id"]]
        nodes.append(resident_node(friend, x, y, row["friendstatus"]))
        edges.append(graph_edge(resident["id"], friend["id"], row["friendstatus"], "friendship"))
    return {
        "title": f"{resident['name']} Friends Network",
        "summary": "Elderly resident friendship graph from residentfriendship rows.",
        "nodes": unique_nodes(nodes),
        "edges": edges,
    }


def build_nursing_management_graph(cursor, current_user, residents, users):
    scoped_residents = visible_residents(cursor, current_user, residents)
    if not scoped_residents:
        return {"title": "Nursing Management", "summary": "No visible nursing assignments for this role.", "nodes": [], "edges": []}
    user_lookup = users_by_public_id(users)
    supervisor_ids = sorted({resident.get("supervisorAccountId") for resident in scoped_residents if resident.get("supervisorAccountId")})
    nurse_ids = sorted({resident.get("nurseAccountId") for resident in scoped_residents if resident.get("nurseAccountId")})
    if current_user and current_user["role"] == "Nurse":
        nurse_ids = [current_user["id"]]
    nodes = []
    edges = []
    supervisor_accounts = [user_lookup[item] for item in supervisor_ids if item in user_lookup]
    nurse_accounts = [user_lookup[item] for item in nurse_ids if item in user_lookup]
    supervisor_positions = {supervisor_accounts[0]["id"]: (50, 50)} if len(supervisor_accounts) == 1 else radial_positions(supervisor_accounts, 50, 50, 15, 12, -90)
    nurse_positions = radial_positions(nurse_accounts, 50, 50, 30, 25, -90)
    resident_positions = radial_positions(scoped_residents, 50, 50, 42, 36, 90)
    for supervisor_id in supervisor_ids:
        supervisor = user_lookup.get(supervisor_id)
        if supervisor:
            x, y = supervisor_positions[supervisor_id]
            nodes.append(account_node(supervisor, x, y, "Nurse manager"))
    for nurse_id in nurse_ids:
        nurse = user_lookup.get(nurse_id)
        if not nurse:
            continue
        x, y = nurse_positions[nurse_id]
        nodes.append(account_node(nurse, x, y, "Primary nurse"))
        for supervisor_id in supervisor_ids:
            if supervisor_id in user_lookup:
                edges.append(graph_edge(supervisor_id, nurse_id, "manages", "nurse-management"))
    for resident in scoped_residents:
        x, y = resident_positions[resident["id"]]
        nodes.append(resident_node(resident, x, y, "Patient"))
        nurse_id = resident.get("nurseAccountId")
        if nurse_id in nurse_ids:
            edges.append(graph_edge(nurse_id, resident["id"], "primary nurse", "nurse-assignment"))
    return {
        "title": "Department 1 Nursing Management",
        "summary": "Nurse manager, primary nurses, and assigned patient edges from staffassignment rows.",
        "nodes": unique_nodes(nodes),
        "edges": edges,
    }


def build_doctor_collaboration_graph(cursor, current_user, residents, users):
    scoped_residents = visible_residents(cursor, current_user, residents)
    if not scoped_residents:
        return {"title": "Doctor Collaboration", "summary": "No visible doctor assignments for this role.", "nodes": [], "edges": []}
    user_lookup = users_by_public_id(users)
    doctor_ids = sorted({
        doctor["id"]
        for resident in scoped_residents
        for doctor in (resident.get("doctors") or [])
    })
    if current_user and current_user["role"] == "Doctor":
        assigned_residents = [
            resident for resident in scoped_residents
            if any(doctor["id"] == current_user["id"] for doctor in (resident.get("doctors") or []))
        ]
        scoped_residents = assigned_residents
        doctor_ids = sorted({
            doctor["id"]
            for resident in scoped_residents
            for doctor in (resident.get("doctors") or [])
        })
    doctor_accounts = [user_lookup[doctor_id] for doctor_id in doctor_ids if doctor_id in user_lookup]
    doctor_positions = radial_positions(doctor_accounts, 50, 50, 42, 36, -90)
    resident_positions = radial_positions(scoped_residents, 50, 50, 20, 17, 90)
    center_id = "group:doctor-collaboration"
    nodes = [
        graph_node(
            center_id,
            "group",
            "Doctor Board",
            "Clinical collaboration center",
            f"{len(doctor_accounts)} doctors",
            50,
            50,
            {
                "Doctors": str(len(doctor_accounts)),
                "Patients": str(len(scoped_residents)),
                "Source": "multi-doctor staffassignment",
            },
            "tone-violet",
        )
    ]
    edges = []
    for doctor_id in doctor_ids:
        doctor = user_lookup.get(doctor_id)
        if doctor:
            x, y = doctor_positions[doctor_id]
            nodes.append(account_node(doctor, x, y, doctor.get("department") or "Doctor"))
    pair_labels = {}
    for resident in scoped_residents:
        x, y = resident_positions[resident["id"]]
        nodes.append(resident_node(resident, x, y, "Patient"))
        edges.append(graph_edge(center_id, resident["id"], "case", "clinical-case"))
        resident_doctor_ids = [doctor["id"] for doctor in (resident.get("doctors") or []) if doctor["id"] in doctor_ids]
        for doctor_id in resident_doctor_ids:
            edges.append(graph_edge(doctor_id, resident["id"], "treats", "doctor-assignment"))
        for index, doctor_id in enumerate(resident_doctor_ids):
            for peer_id in resident_doctor_ids[index + 1:]:
                pair = tuple(sorted((doctor_id, peer_id)))
                pair_labels.setdefault(pair, []).append(resident["name"].split()[0])
    for (source, target), labels in pair_labels.items():
        edges.append(graph_edge(source, target, ", ".join(labels[:3]), "clinical-collaboration"))
    return {
        "title": "Department 1 Doctor Collaboration",
        "summary": "Doctor-to-patient and co-treatment edges from multi-doctor staffassignment rows.",
        "nodes": unique_nodes(nodes),
        "edges": edges,
    }


def get_resident(public_id):
    resident_id = parse_prefixed_id(public_id, "r")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        return serialize_resident_by_id(cursor, resident_id)


def create_resident(payload):
    validate_resident_payload(payload)
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO resident
                (fullname, gender, age, birthdate, hometown, roomnumber, bednumber, floorname, carelevel, healthtags,
                 admissiondate, residentstatus, emergencycontact)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            resident_params(payload),
        )
        resident_id = cursor.lastrowid
        replace_family_binding(cursor, resident_id, payload)
        replace_staff_assignments(cursor, resident_id, payload)
        audit(cursor, "Created resident profile", "resident", resident_id, payload["name"])
        return serialize_resident_by_id(cursor, resident_id)


def update_resident(public_id, payload):
    resident_id = parse_prefixed_id(public_id, "r")
    validate_resident_payload(payload)
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        ensure_resident(cursor, resident_id)
        cursor.execute(
            """
            UPDATE resident
            SET fullname=%s, gender=%s, age=%s, birthdate=%s, hometown=%s,
                roomnumber=%s, bednumber=%s, floorname=%s,
                carelevel=%s, healthtags=%s, admissiondate=%s, residentstatus=%s,
                emergencycontact=%s
            WHERE residentid=%s
            """,
            resident_params(payload) + (resident_id,),
        )
        replace_family_binding(cursor, resident_id, payload)
        replace_staff_assignments(cursor, resident_id, payload)
        audit(cursor, "Edited resident profile", "resident", resident_id, payload["name"])
        return serialize_resident_by_id(cursor, resident_id)


def resident_delete_impact(public_id):
    resident_id = parse_prefixed_id(public_id, "r")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = ensure_resident(cursor, resident_id)
        return build_resident_delete_impact(cursor, resident_id, row)


def delete_resident(public_id):
    resident_id = parse_prefixed_id(public_id, "r")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = ensure_resident(cursor, resident_id)
        count = fetch_one(cursor, "SELECT COUNT(*) AS total FROM resident")["total"]
        if count <= 1:
            raise ConflictError("At least one resident is required")
        impact = build_resident_delete_impact(cursor, resident_id, row)
        account_ids_to_delete = [
            item["accountId"] for item in impact["residentPortalAccounts"]
        ] + [
            item["accountId"] for item in impact["familyAccountsToDelete"]
        ]
        if account_ids_to_delete:
            remaining_accounts = fetch_one(cursor, "SELECT COUNT(*) AS total FROM account")["total"] - len(set(account_ids_to_delete))
            if remaining_accounts <= 0:
                raise ConflictError("At least one account is required")
            placeholders = ", ".join(["%s"] * len(set(account_ids_to_delete)))
            cursor.execute(
                f"DELETE FROM account WHERE accountid IN ({placeholders})",
                tuple(set(account_ids_to_delete)),
            )
        cursor.execute("DELETE FROM resident WHERE residentid = %s", (resident_id,))
        audit(
            cursor,
            "Deleted resident profile",
            "resident",
            resident_id,
            (
                f"{row['fullname']}; removed {len(impact['residentPortalAccounts'])} resident portal accounts, "
                f"{len(impact['familyAccountsToDelete'])} exclusive family accounts, "
                f"{impact['staffAssignmentCount']} staff assignments"
            ),
        )
        return impact


def build_resident_delete_impact(cursor, resident_id, resident_row):
    portal_accounts = fetch_all(
        cursor,
        """
        SELECT a.accountid, a.fullname, a.username, a.rolename
        FROM residentaccount ra
        JOIN account a ON a.accountid = ra.accountid
        WHERE ra.residentid = %s
        ORDER BY a.accountid
        """,
        (resident_id,),
    )
    family_rows = fetch_all(
        cursor,
        """
        SELECT fb.bindingid, fb.relationship, fb.primaryflag,
               a.accountid, a.fullname, a.username, a.rolename
        FROM familybinding fb
        JOIN account a ON a.accountid = fb.accountid
        WHERE fb.residentid = %s
        ORDER BY fb.primaryflag DESC, fb.bindingid
        """,
        (resident_id,),
    )
    family_accounts_to_delete = []
    family_accounts_to_unbind = []
    for family in family_rows:
        binding_count = fetch_one(
            cursor,
            "SELECT COUNT(*) AS total FROM familybinding WHERE accountid = %s",
            (family["accountid"],),
        )["total"]
        impact_item = {
            "accountId": family["accountid"],
            "id": account_public_id(family["accountid"]),
            "name": family["fullname"],
            "username": family.get("username") or "",
            "relationship": family["relationship"],
            "primary": bool(family["primaryflag"]),
            "bindingCount": binding_count,
        }
        if binding_count <= 1:
            family_accounts_to_delete.append(impact_item)
        else:
            family_accounts_to_unbind.append(impact_item)
    staff_assignment_count = fetch_one(
        cursor,
        "SELECT COUNT(*) AS total FROM staffassignment WHERE residentid = %s",
        (resident_id,),
    )["total"]
    friendship_count = fetch_one(
        cursor,
        """
        SELECT COUNT(*) AS total
        FROM residentfriendship
        WHERE residentid = %s OR friendresidentid = %s
        """,
        (resident_id, resident_id),
    )["total"]
    return {
        "resident": {
            "id": resident_public_id(resident_id),
            "residentId": resident_id,
            "name": resident_row["fullname"],
        },
        "residentPortalAccounts": [
            {
                "accountId": account["accountid"],
                "id": account_public_id(account["accountid"]),
                "name": account["fullname"],
                "username": account.get("username") or "",
                "role": account["rolename"],
            }
            for account in portal_accounts
        ],
        "familyAccountsToDelete": family_accounts_to_delete,
        "familyAccountsToUnbindOnly": family_accounts_to_unbind,
        "staffAssignmentCount": staff_assignment_count,
        "friendshipCount": friendship_count,
    }


def update_family_binding(public_id, payload):
    resident_id = parse_prefixed_id(public_id, "r")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        ensure_resident(cursor, resident_id)
        replace_family_binding(cursor, resident_id, payload)
        audit(cursor, "Updated family binding", "resident", resident_id, str(payload.get("familyAccountId", "")))
        return serialize_resident_by_id(cursor, resident_id)


def update_staff_assignments(public_id, payload):
    resident_id = parse_prefixed_id(public_id, "r")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        ensure_resident(cursor, resident_id)
        replace_staff_assignments(cursor, resident_id, payload)
        audit(cursor, "Updated staff assignment", "resident", resident_id, "Staff assignment update")
        return serialize_resident_by_id(cursor, resident_id)


def update_permissions(public_id, payload):
    resident_id = parse_prefixed_id(public_id, "r")
    permissions = payload.get("permissions") or payload
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        ensure_resident(cursor, resident_id)
        binding = fetch_one(cursor, "SELECT * FROM familybinding WHERE residentid = %s ORDER BY primaryflag DESC, bindingid LIMIT 1", (resident_id,))
        if not binding:
            raise NotFoundError("Family binding not found")
        cursor.execute(
            """
            UPDATE familybinding
            SET reportflag=%s, appointmentflag=%s, staffscheduleflag=%s, healthattachmentflag=%s
            WHERE bindingid=%s
            """,
            (
                bool_to_int(permissions.get("dailyReports")),
                bool_to_int(permissions.get("appointments")),
                bool_to_int(permissions.get("staffSchedules")),
                bool_to_int(permissions.get("healthAttachments")),
                binding["bindingid"],
            ),
        )
        audit(cursor, "Updated resident permission", "resident", resident_id, str(permissions))
        return serialize_resident_by_id(cursor, resident_id)


def validate_resident_payload(payload):
    validate_required(payload, ["name", "gender", "age", "room", "bed", "floor", "careLevel", "admissionDate"])
    age = int(payload["age"])
    if age < 60 or age > 120:
        raise ValidationError("Resident age must be between 60 and 120")


def resident_params(payload):
    return (
        payload["name"].strip(),
        payload["gender"],
        int(payload["age"]),
        payload.get("birthdate") or None,
        payload.get("hometown") or "",
        payload["room"].strip(),
        payload["bed"].strip(),
        payload["floor"],
        payload["careLevel"],
        ", ".join(split_tags(payload.get("tags"))),
        payload.get("admissionDate") or date.today().isoformat(),
        payload.get("status") or "Active",
        payload.get("emergencyContact") or payload.get("primaryFamily") or "",
    )


def replace_family_binding(cursor, resident_id, payload):
    account_id = parse_prefixed_id(payload.get("familyAccountId"), "u")
    if not account_id:
        return
    account = ensure_account(cursor, account_id)
    if account["rolename"] != "Family Member":
        raise ValidationError("Only Family Member accounts can be bound as family")
    permissions = payload.get("permissions") or {}
    cursor.execute("UPDATE familybinding SET primaryflag = 0 WHERE residentid = %s", (resident_id,))
    cursor.execute(
        """
        INSERT INTO familybinding
            (residentid, accountid, relationship, primaryflag, emergencyflag, reportflag,
             appointmentflag, staffscheduleflag, healthattachmentflag)
        VALUES (%s, %s, %s, 1, 1, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            relationship=VALUES(relationship),
            primaryflag=1,
            emergencyflag=1,
            reportflag=VALUES(reportflag),
            appointmentflag=VALUES(appointmentflag),
            staffscheduleflag=VALUES(staffscheduleflag),
            healthattachmentflag=VALUES(healthattachmentflag)
        """,
        (
            resident_id,
            account_id,
            payload.get("familyRelationship") or "Family",
            bool_to_int(permissions.get("dailyReports", True)),
            bool_to_int(permissions.get("appointments", True)),
            bool_to_int(permissions.get("staffSchedules", False)),
            bool_to_int(permissions.get("healthAttachments", False)),
        ),
    )


def replace_staff_assignments(cursor, resident_id, payload):
    cursor.execute(
        "DELETE FROM staffassignment WHERE residentid = %s AND responsibility IN ('nurse', 'supervisor', 'doctor')",
        (resident_id,),
    )
    for payload_key, responsibility in STAFF_RESPONSIBILITIES.items():
        if payload_key == "doctor":
            continue
        account_id = parse_prefixed_id(payload.get(f"{payload_key}AccountId"), "u")
        if not account_id:
            continue
        account = ensure_account(cursor, account_id)
        allowed = ROLE_ASSIGNMENT_OPTIONS.get(account["rolename"], set())
        if responsibility not in allowed:
            raise ValidationError(f"{account['rolename']} cannot be assigned as {ASSIGNMENT_LABELS[responsibility]}")
        cursor.execute(
            """
            INSERT INTO staffassignment (residentid, accountid, responsibility, startdate, assignstatus)
            VALUES (%s, %s, %s, CURRENT_DATE, 'Active')
            ON DUPLICATE KEY UPDATE assignstatus='Active', enddate=NULL, startdate=CURRENT_DATE
            """,
            (resident_id, account_id, responsibility),
        )
    doctor_account_ids = payload.get("doctorAccountIds")
    if doctor_account_ids is None:
        doctor_account_ids = [payload.get("doctorAccountId")] if payload.get("doctorAccountId") else []
    if isinstance(doctor_account_ids, str):
        doctor_account_ids = [doctor_account_ids]
    for raw_account_id in doctor_account_ids:
        account_id = parse_prefixed_id(raw_account_id, "u")
        if not account_id:
            continue
        account = ensure_account(cursor, account_id)
        if account["rolename"] != "Doctor":
            raise ValidationError("Only Doctor accounts can be assigned as Doctor")
        cursor.execute(
            """
            INSERT INTO staffassignment (residentid, accountid, responsibility, startdate, assignstatus)
            VALUES (%s, %s, 'doctor', CURRENT_DATE, 'Active')
            ON DUPLICATE KEY UPDATE assignstatus='Active', enddate=NULL, startdate=CURRENT_DATE
            """,
            (resident_id, account_id),
        )


def list_account_records():
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        return list_accounts(cursor)


def serialize_account_by_id(cursor, account_id):
    row = ensure_account(cursor, account_id)
    return serialize_account(
        row,
        account_resident_links(cursor).get(account_id, []),
        account_staff_assignment_links(cursor).get(account_id, []),
        account_family_binding_links(cursor).get(account_id, []),
    )


def get_account(public_id):
    account_id = parse_prefixed_id(public_id, "u")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        return serialize_account_by_id(cursor, account_id)


def get_account_by_db_id(account_id):
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = fetch_one(cursor, "SELECT * FROM account WHERE accountid = %s", (account_id,))
        if not row:
            return None
        return serialize_account_by_id(cursor, row["accountid"])


def authenticate_account(identifier, password):
    identifier = (identifier or "").strip()
    password = (password or "").strip()
    if not identifier or not password:
        raise ValidationError("Username and password are required")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = fetch_one(
            cursor,
            """
            SELECT * FROM account
            WHERE (username = %s OR phone = %s) AND passhash = %s
            LIMIT 1
            """,
            (identifier, identifier, password),
        )
        if not row:
            raise ValidationError("Invalid username or password")
        if row["accountstatus"] != "Active":
            raise ConflictError("This account is frozen or inactive")
        return serialize_account_by_id(cursor, row["accountid"])


def find_account_for_recovery(identifier):
    identifier = (identifier or "").strip()
    if not identifier:
        raise ValidationError("Account name is required")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = fetch_one(
            cursor,
            """
            SELECT accountid
            FROM account
            WHERE username = %s OR phone = %s
            LIMIT 1
            """,
            (identifier, identifier),
        )
        if not row:
            raise ValidationError("Account not found")
        return serialize_account_by_id(cursor, row["accountid"])


def reset_account_password(account_id, password):
    password = (password or "").strip()
    if len(password) < 6:
        raise ValidationError("Password must be at least 6 characters")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = fetch_one(cursor, "SELECT accountid FROM account WHERE accountid = %s LIMIT 1", (account_id,))
        if not row:
            raise ValidationError("Recovery session expired")
        cursor.execute(
            "UPDATE account SET passhash = %s WHERE accountid = %s",
            (password, account_id),
        )
        audit(cursor, "Reset account password", "account", account_id, "Password recovery flow")


def create_account(payload):
    validate_account_payload(payload)
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                INSERT INTO account (username, fullname, phone, passhash, rolename, department, accountstatus)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                account_params(payload),
            )
        except MySQLError as error:
            handle_mysql_write_error(error)
        account_id = cursor.lastrowid
        audit(cursor, "Created user account", "account", account_id, payload["name"])
        return serialize_account_by_id(cursor, account_id)


def update_account(public_id, payload):
    account_id = parse_prefixed_id(public_id, "u")
    validate_account_payload(payload)
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        ensure_account(cursor, account_id)
        try:
            cursor.execute(
                """
                UPDATE account
                SET username=%s, fullname=%s, phone=%s, passhash=%s, rolename=%s, department=%s, accountstatus=%s
                WHERE accountid=%s
                """,
                account_params(payload) + (account_id,),
            )
        except MySQLError as error:
            handle_mysql_write_error(error)
        audit(cursor, "Edited user account", "account", account_id, payload["name"])
        return serialize_account_by_id(cursor, account_id)


def delete_account(public_id):
    account_id = parse_prefixed_id(public_id, "u")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = ensure_account(cursor, account_id)
        count = fetch_one(cursor, "SELECT COUNT(*) AS total FROM account")["total"]
        if count <= 1:
            raise ConflictError("At least one account is required")
        affected_family_residents = [
            item["residentid"] for item in fetch_all(
                cursor,
                "SELECT residentid FROM familybinding WHERE accountid = %s",
                (account_id,),
            )
        ]
        cursor.execute("DELETE FROM account WHERE accountid = %s", (account_id,))
        for resident_id in affected_family_residents:
            promote_primary_family_if_needed(cursor, resident_id)
        audit(cursor, "Deleted user account", "account", account_id, row["fullname"])


def update_account_status(public_id, payload):
    account_id = parse_prefixed_id(public_id, "u")
    status = payload.get("status")
    if status not in ("Active", "Frozen"):
        raise ValidationError("Status must be Active or Frozen")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = ensure_account(cursor, account_id)
        cursor.execute("UPDATE account SET accountstatus=%s WHERE accountid=%s", (status, account_id))
        audit(cursor, "Updated account status", "account", account_id, f"{row['fullname']} -> {status}")
        return serialize_account_by_id(cursor, account_id)


def assign_account_to_resident(public_id, payload):
    account_id = parse_prefixed_id(public_id, "u")
    resident_id = parse_prefixed_id(payload.get("residentId"), "r")
    responsibility = (payload.get("responsibility") or "").strip()
    if responsibility not in ASSIGNMENT_LABELS:
        raise ValidationError("Invalid assignment responsibility")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        account = ensure_account(cursor, account_id)
        resident = ensure_resident(cursor, resident_id)
        allowed = ROLE_ASSIGNMENT_OPTIONS.get(account["rolename"], set())
        if responsibility not in allowed:
            raise ValidationError(f"{account['rolename']} cannot be assigned as {ASSIGNMENT_LABELS[responsibility]}")
        if responsibility in UNIQUE_STAFF_RESPONSIBILITIES:
            cursor.execute(
                "DELETE FROM staffassignment WHERE residentid = %s AND responsibility = %s",
                (resident_id, responsibility),
            )
        cursor.execute(
            """
            INSERT INTO staffassignment (residentid, accountid, responsibility, startdate, assignstatus)
            VALUES (%s, %s, %s, CURRENT_DATE, 'Active')
            ON DUPLICATE KEY UPDATE assignstatus='Active', enddate=NULL, startdate=CURRENT_DATE
            """,
            (resident_id, account_id, responsibility),
        )
        audit(
            cursor,
            "Assigned account to resident",
            "staffassignment",
            cursor.lastrowid or account_id,
            f"{account['fullname']} -> {resident['fullname']} ({ASSIGNMENT_LABELS[responsibility]})",
        )
        return serialize_account_by_id(cursor, account_id)


def delete_account_assignment(public_id, assignment_id):
    account_id = parse_prefixed_id(public_id, "u")
    try:
        parsed_assignment_id = int(assignment_id)
    except (TypeError, ValueError) as error:
        raise ValidationError("Invalid assignment id") from error
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = fetch_one(
            cursor,
            """
            SELECT sa.*, a.fullname AS accountname, r.fullname AS residentname
            FROM staffassignment sa
            JOIN account a ON a.accountid = sa.accountid
            JOIN resident r ON r.residentid = sa.residentid
            WHERE sa.assignid = %s AND sa.accountid = %s
            """,
            (parsed_assignment_id, account_id),
        )
        if not row:
            raise NotFoundError("Assignment not found")
        cursor.execute("DELETE FROM staffassignment WHERE assignid = %s", (parsed_assignment_id,))
        audit(
            cursor,
            "Removed account resident assignment",
            "staffassignment",
            parsed_assignment_id,
            f"{row['accountname']} -/-> {row['residentname']} ({ASSIGNMENT_LABELS.get(row['responsibility'], row['responsibility'])})",
        )
        return serialize_account_by_id(cursor, account_id)


def family_binding_payload(payload):
    permissions = payload.get("permissions") or {}
    return {
        "relationship": (payload.get("relationship") or payload.get("familyRelationship") or "Family").strip(),
        "permissions": {
            "dailyReports": permissions.get("dailyReports", True),
            "appointments": permissions.get("appointments", True),
            "staffSchedules": permissions.get("staffSchedules", False),
            "healthAttachments": permissions.get("healthAttachments", False),
        },
        "primary": bool(payload.get("primary")),
    }


def upsert_family_binding(cursor, resident_id, account_id, binding_payload):
    account = ensure_account(cursor, account_id)
    if account["rolename"] != "Family Member":
        raise ValidationError("Only Family Member accounts can be bound to residents")
    ensure_resident(cursor, resident_id)
    has_primary = bool(fetch_one(
        cursor,
        "SELECT 1 FROM familybinding WHERE residentid = %s AND primaryflag = 1 LIMIT 1",
        (resident_id,),
    ))
    primary = binding_payload["primary"] or not has_primary
    if primary:
        cursor.execute("UPDATE familybinding SET primaryflag = 0 WHERE residentid = %s", (resident_id,))
    permissions = binding_payload["permissions"]
    primary_update = ", primaryflag=VALUES(primaryflag)" if primary else ""
    cursor.execute(
        f"""
        INSERT INTO familybinding
            (residentid, accountid, relationship, primaryflag, emergencyflag, reportflag,
             appointmentflag, staffscheduleflag, healthattachmentflag)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            relationship=VALUES(relationship),
            emergencyflag=VALUES(emergencyflag),
            reportflag=VALUES(reportflag),
            appointmentflag=VALUES(appointmentflag),
            staffscheduleflag=VALUES(staffscheduleflag),
            healthattachmentflag=VALUES(healthattachmentflag)
            {primary_update}
        """,
        (
            resident_id,
            account_id,
            binding_payload["relationship"],
            bool_to_int(primary),
            bool_to_int(primary),
            bool_to_int(permissions.get("dailyReports")),
            bool_to_int(permissions.get("appointments")),
            bool_to_int(permissions.get("staffSchedules")),
            bool_to_int(permissions.get("healthAttachments")),
        ),
    )


def promote_primary_family_if_needed(cursor, resident_id):
    has_primary = fetch_one(
        cursor,
        "SELECT 1 FROM familybinding WHERE residentid = %s AND primaryflag = 1 LIMIT 1",
        (resident_id,),
    )
    if has_primary:
        return
    next_binding = fetch_one(
        cursor,
        "SELECT bindingid FROM familybinding WHERE residentid = %s ORDER BY bindingid LIMIT 1",
        (resident_id,),
    )
    if next_binding:
        cursor.execute("UPDATE familybinding SET primaryflag = 1 WHERE bindingid = %s", (next_binding["bindingid"],))


def bind_family_account_to_resident(public_id, payload):
    account_id = parse_prefixed_id(public_id, "u")
    resident_id = parse_prefixed_id(payload.get("residentId"), "r")
    binding_payload = family_binding_payload(payload)
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        account = ensure_account(cursor, account_id)
        resident = ensure_resident(cursor, resident_id)
        if account["rolename"] != "Family Member":
            raise ValidationError("Only Family Member accounts can be bound to residents")
        upsert_family_binding(cursor, resident_id, account_id, binding_payload)
        audit(
            cursor,
            "Bound family account to resident",
            "familybinding",
            account_id,
            f"{account['fullname']} -> {resident['fullname']} ({binding_payload['relationship']})",
        )
        return serialize_account_by_id(cursor, account_id)


def delete_family_binding(public_id, binding_id):
    account_id = parse_prefixed_id(public_id, "u")
    try:
        parsed_binding_id = int(binding_id)
    except (TypeError, ValueError) as error:
        raise ValidationError("Invalid family binding id") from error
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        row = fetch_one(
            cursor,
            """
            SELECT fb.*, a.fullname AS accountname, r.fullname AS residentname
            FROM familybinding fb
            JOIN account a ON a.accountid = fb.accountid
            JOIN resident r ON r.residentid = fb.residentid
            WHERE fb.bindingid = %s AND fb.accountid = %s
            """,
            (parsed_binding_id, account_id),
        )
        if not row:
            raise NotFoundError("Family binding not found")
        cursor.execute("DELETE FROM familybinding WHERE bindingid = %s", (parsed_binding_id,))
        promote_primary_family_if_needed(cursor, row["residentid"])
        audit(
            cursor,
            "Removed family resident binding",
            "familybinding",
            parsed_binding_id,
            f"{row['accountname']} -/-> {row['residentname']} ({row['relationship']})",
        )
        return serialize_account_by_id(cursor, account_id)


def resident_id_for_elderly_account(cursor, account_id):
    row = fetch_one(cursor, "SELECT residentid FROM residentaccount WHERE accountid = %s LIMIT 1", (account_id,))
    if not row:
        raise NotFoundError("Resident portal account is not linked to a resident")
    return row["residentid"]


def create_self_family_account(elderly_account_id, payload):
    if payload.get("role") and payload.get("role") != "Family Member":
        raise ValidationError("Elderly accounts can only create Family Member accounts")
    validate_required(payload, ["name", "phone"])
    binding_payload = family_binding_payload(payload)
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        elderly_account = ensure_account(cursor, elderly_account_id)
        if elderly_account["rolename"] != "Elderly Resident":
            raise ValidationError("Only Elderly Resident accounts can create family accounts here")
        resident_id = resident_id_for_elderly_account(cursor, elderly_account_id)
        username = (payload.get("username") or payload["phone"]).strip()
        try:
            cursor.execute(
                """
                INSERT INTO account (username, fullname, phone, passhash, rolename, department, accountstatus)
                VALUES (%s, %s, %s, %s, 'Family Member', 'Family Portal', 'Active')
                """,
                (
                    username,
                    payload["name"].strip(),
                    payload["phone"].strip(),
                    payload.get("password") or "123456",
                ),
            )
        except MySQLError as error:
            handle_mysql_write_error(error)
        family_account_id = cursor.lastrowid
        upsert_family_binding(cursor, resident_id, family_account_id, binding_payload)
        audit(
            cursor,
            "Resident portal created family account",
            "account",
            family_account_id,
            f"{elderly_account['fullname']} created {payload['name'].strip()}",
        )
        return {
            "user": serialize_account_by_id(cursor, family_account_id),
            "resident": serialize_resident_by_id(cursor, resident_id),
        }


def delete_self_family_account(elderly_account_id, binding_id):
    try:
        parsed_binding_id = int(binding_id)
    except (TypeError, ValueError) as error:
        raise ValidationError("Invalid family binding id") from error
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        elderly_account = ensure_account(cursor, elderly_account_id)
        if elderly_account["rolename"] != "Elderly Resident":
            raise ValidationError("Only Elderly Resident accounts can delete family accounts here")
        resident_id = resident_id_for_elderly_account(cursor, elderly_account_id)
        row = fetch_one(
            cursor,
            """
            SELECT fb.*, a.fullname AS accountname, a.rolename
            FROM familybinding fb
            JOIN account a ON a.accountid = fb.accountid
            WHERE fb.bindingid = %s AND fb.residentid = %s
            """,
            (parsed_binding_id, resident_id),
        )
        if not row:
            raise NotFoundError("Family binding not found")
        if row["rolename"] != "Family Member":
            raise ValidationError("Elderly accounts can only remove Family Member accounts")
        family_account_id = row["accountid"]
        cursor.execute("DELETE FROM familybinding WHERE bindingid = %s", (parsed_binding_id,))
        remaining = fetch_one(
            cursor,
            "SELECT COUNT(*) AS total FROM familybinding WHERE accountid = %s",
            (family_account_id,),
        )["total"]
        if remaining == 0:
            cursor.execute("DELETE FROM account WHERE accountid = %s", (family_account_id,))
        promote_primary_family_if_needed(cursor, resident_id)
        audit(
            cursor,
            "Resident portal deleted family account",
            "familybinding",
            parsed_binding_id,
            f"{elderly_account['fullname']} removed {row['accountname']}",
        )
        return {
            "ok": True,
            "deletedAccountId": account_public_id(family_account_id) if remaining == 0 else "",
            "resident": serialize_resident_by_id(cursor, resident_id),
        }


def create_self_friend(elderly_account_id, payload):
    friend_resident_id = parse_prefixed_id(payload.get("friendResidentId"), "r")
    if not friend_resident_id:
        raise ValidationError("Friend resident is required")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        elderly_account = ensure_account(cursor, elderly_account_id)
        if elderly_account["rolename"] != "Elderly Resident":
            raise ValidationError("Only Elderly Resident accounts can add resident friends")
        resident_id = resident_id_for_elderly_account(cursor, elderly_account_id)
        if friend_resident_id == resident_id:
            raise ValidationError("You cannot add yourself as a friend")
        current_user = serialize_account_by_id(cursor, elderly_account_id)
        candidate_ids = {
            resident["residentId"]
            for resident in friend_candidate_options(cursor, current_user, list_residents(cursor))
        }
        if friend_resident_id not in candidate_ids:
            raise ValidationError("Friend discovery is not available for this resident")
        friend = ensure_resident(cursor, friend_resident_id)
        existing = fetch_one(
            cursor,
            "SELECT 1 FROM residentfriendship WHERE residentid = %s AND friendresidentid = %s LIMIT 1",
            (resident_id, friend_resident_id),
        )
        if existing:
            raise ConflictError("Friend already added")
        cursor.execute(
            """
            INSERT INTO residentfriendship (residentid, friendresidentid, friendstatus)
            VALUES (%s, %s, 'Accepted')
            """,
            (resident_id, friend_resident_id),
        )
        friendship_id = cursor.lastrowid
        cursor.execute(
            """
            INSERT INTO residentfriendship (residentid, friendresidentid, friendstatus)
            VALUES (%s, %s, 'Accepted')
            ON DUPLICATE KEY UPDATE friendstatus='Accepted', updatedat=CURRENT_TIMESTAMP
            """,
            (friend_resident_id, resident_id),
        )
        resident = ensure_resident(cursor, resident_id)
        audit(
            cursor,
            "Resident portal added friend",
            "residentfriendship",
            friendship_id,
            f"{resident['fullname']} -> {friend['fullname']}",
        )
        all_residents = list_residents(cursor)
        return {
            "friends": friend_records_for_resident(cursor, resident_id, all_residents),
            "friendCandidates": friend_candidate_options(cursor, current_user, all_residents),
        }


def delete_self_friend(elderly_account_id, friendship_id):
    try:
        parsed_friendship_id = int(friendship_id)
    except (TypeError, ValueError) as error:
        raise ValidationError("Invalid friendship id") from error
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        elderly_account = ensure_account(cursor, elderly_account_id)
        if elderly_account["rolename"] != "Elderly Resident":
            raise ValidationError("Only Elderly Resident accounts can remove resident friends")
        resident_id = resident_id_for_elderly_account(cursor, elderly_account_id)
        row = fetch_one(
            cursor,
            """
            SELECT rf.*, r.fullname AS residentname, fr.fullname AS friendname
            FROM residentfriendship rf
            JOIN resident r ON r.residentid = rf.residentid
            JOIN resident fr ON fr.residentid = rf.friendresidentid
            WHERE rf.friendshipid = %s AND rf.residentid = %s
            """,
            (parsed_friendship_id, resident_id),
        )
        if not row:
            raise NotFoundError("Friendship not found")
        friend_resident_id = row["friendresidentid"]
        cursor.execute(
            """
            DELETE FROM residentfriendship
            WHERE (residentid = %s AND friendresidentid = %s)
               OR (residentid = %s AND friendresidentid = %s)
            """,
            (resident_id, friend_resident_id, friend_resident_id, resident_id),
        )
        audit(
            cursor,
            "Resident portal removed friend",
            "residentfriendship",
            parsed_friendship_id,
            f"{row['residentname']} -/-> {row['friendname']}",
        )
        all_residents = list_residents(cursor)
        return {
            "ok": True,
            "friends": friend_records_for_resident(cursor, resident_id, all_residents),
            "friendCandidates": friend_candidate_options(cursor, serialize_account_by_id(cursor, elderly_account_id), all_residents),
        }


def validate_account_payload(payload):
    validate_required(payload, ["name", "phone", "role"])
    if len(payload["phone"].strip()) < 3:
        raise ValidationError("Phone must contain at least 3 characters")


def account_params(payload):
    phone = payload["phone"].strip()
    username = (payload.get("username") or phone).strip()
    return (
        username,
        payload["name"].strip(),
        phone,
        payload.get("password") or payload.get("passhash") or "123456",
        payload["role"],
        payload.get("department") or "CareBridge",
        payload.get("status") or "Active",
    )


def ensure_resident(cursor, resident_id):
    row = fetch_one(cursor, "SELECT * FROM resident WHERE residentid = %s", (resident_id,))
    if not row:
        raise NotFoundError("Resident not found")
    return row


def ensure_account(cursor, account_id):
    row = fetch_one(cursor, "SELECT * FROM account WHERE accountid = %s", (account_id,))
    if not row:
        raise NotFoundError("Account not found")
    return row


def handle_mysql_write_error(error):
    if getattr(error, "errno", None) == errorcode.ER_DUP_ENTRY:
        raise ConflictError("Username or phone already exists") from error
    raise error


def audit(cursor, action, target_type, target_id, detail):
    actor = fetch_one(cursor, "SELECT accountid FROM account ORDER BY accountid LIMIT 1")
    actor_id = actor["accountid"] if actor else None
    cursor.execute(
        """
        INSERT INTO auditlog (accountid, actionname, targettype, targetid, detail, ipaddress)
        VALUES (%s, %s, %s, %s, %s, '127.0.0.1')
        """,
        (actor_id, action, target_type, target_id, detail),
    )
