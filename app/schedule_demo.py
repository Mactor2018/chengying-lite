# -*- encoding: utf-8 -*-

from flask import flash, redirect, render_template, request, url_for

from app import app
from app.auth import current_account
from app.db import DatabaseUnavailable
from app.group_demo_db import (
    DemoNotFoundError,
    DemoValidationError,
    account_name,
    accounts_for_select,
    execute_transaction,
    fetch_all,
    fetch_one,
    iso_datetime,
    residents_for_select,
    today_iso,
    validate_required,
    ensure_group_demo_schema,
)
from app.team_route_helpers import database_error_page, page_or_redirect


EVENT_TYPES = ["Care Task", "Clinical Check", "Activity", "Appointment", "Family Meeting"]
EVENT_STATUSES = ["Scheduled", "Completed", "Cancelled"]
APPOINTMENT_TYPES = ["Video Call", "Family Visit", "Care Plan Meeting", "Medical Review"]
APPOINTMENT_STATUSES = ["Pending", "Approved", "Rejected", "Completed"]


def _page(key):
    return page_or_redirect(key)


def _datetime_value(value):
    return (value or "").replace("T", " ")


def _schedule_options():
    return {
        "residents": residents_for_select(),
        "staff_accounts": accounts_for_select(["Nursing Supervisor", "Nurse", "Doctor", "Caregiver"]),
        "family_accounts": accounts_for_select(["Family Member"]),
        "event_types": EVENT_TYPES,
        "event_statuses": EVENT_STATUSES,
        "appointment_types": APPOINTMENT_TYPES,
        "appointment_statuses": APPOINTMENT_STATUSES,
    }


@app.get("/schedule")
def schedule_board():
    page, response = _page("schedule")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        filters = {
            "residentid": request.args.get("residentid", ""),
            "staffid": request.args.get("staffid", ""),
            "eventtype": request.args.get("eventtype", ""),
            "eventstatus": request.args.get("eventstatus", ""),
            "date": request.args.get("date", today_iso()),
        }
        conditions = []
        params = []
        if filters["residentid"]:
            conditions.append("se.residentid = %s")
            params.append(filters["residentid"])
        if filters["staffid"]:
            conditions.append("se.staffid = %s")
            params.append(filters["staffid"])
        if filters["eventtype"]:
            conditions.append("se.eventtype = %s")
            params.append(filters["eventtype"])
        if filters["eventstatus"]:
            conditions.append("se.eventstatus = %s")
            params.append(filters["eventstatus"])
        if filters["date"]:
            conditions.append("DATE(se.starttime) = %s")
            params.append(filters["date"])
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        events = fetch_all(
            f"""
            SELECT se.*, r.fullname AS residentname, r.roomnumber,
                   a.fullname AS staffname, a.rolename AS staffrole
            FROM scheduleevent se
            JOIN resident r ON r.residentid = se.residentid
            JOIN account a ON a.accountid = se.staffid
            {where_clause}
            ORDER BY se.starttime, se.eventid
            """,
            params,
        )
        metrics = fetch_one(
            """
            SELECT
                COUNT(*) AS total,
                SUM(eventstatus='Scheduled') AS scheduledcount,
                SUM(eventstatus='Completed') AS completedcount,
                SUM(DATE(starttime)=CURDATE()) AS todaycount
            FROM scheduleevent
            """
        )
        return render_template(
            "pages/schedule.html",
            page=page,
            events=events,
            filters=filters,
            metrics=metrics,
            editing_event=None,
            **_schedule_options(),
        )
    except DatabaseUnavailable as error:
        return database_error_page("schedule", error)


@app.get("/schedule/edit/<int:event_id>")
def edit_schedule_event(event_id):
    page, response = _page("schedule")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        editing_event = _get_event(event_id)
        events = fetch_all(
            """
            SELECT se.*, r.fullname AS residentname, r.roomnumber,
                   a.fullname AS staffname, a.rolename AS staffrole
            FROM scheduleevent se
            JOIN resident r ON r.residentid = se.residentid
            JOIN account a ON a.accountid = se.staffid
            ORDER BY se.starttime DESC, se.eventid DESC
            LIMIT 25
            """
        )
        metrics = fetch_one(
            """
            SELECT COUNT(*) AS total,
                   SUM(eventstatus='Scheduled') AS scheduledcount,
                   SUM(eventstatus='Completed') AS completedcount,
                   SUM(DATE(starttime)=CURDATE()) AS todaycount
            FROM scheduleevent
            """
        )
        return render_template(
            "pages/schedule.html",
            page=page,
            events=events,
            filters={"date": "", "residentid": "", "staffid": "", "eventtype": "", "eventstatus": ""},
            metrics=metrics,
            editing_event=editing_event,
            **_schedule_options(),
        )
    except (DatabaseUnavailable, DemoNotFoundError) as error:
        if isinstance(error, DatabaseUnavailable):
            return database_error_page("schedule", error)
        flash(str(error))
        return redirect(url_for("schedule_board"))


@app.post("/schedule/save")
def save_schedule():
    try:
        ensure_group_demo_schema()
        payload = {
            "eventid": request.form.get("eventid", "").strip(),
            "residentid": request.form.get("residentid", "").strip(),
            "staffid": request.form.get("staffid", "").strip(),
            "eventtitle": request.form.get("eventtitle", "").strip(),
            "eventtype": request.form.get("eventtype", "").strip(),
            "starttime": _datetime_value(request.form.get("starttime", "").strip()),
            "endtime": _datetime_value(request.form.get("endtime", "").strip()),
            "eventstatus": request.form.get("eventstatus", "Scheduled").strip(),
            "notes": request.form.get("notes", "").strip(),
        }
        validate_required(payload, ["residentid", "staffid", "eventtitle", "eventtype", "starttime", "endtime", "eventstatus"])
        actor = current_account()

        def transaction(cursor):
            if payload["eventid"]:
                cursor.execute(
                    """
                    UPDATE scheduleevent
                    SET residentid=%s, staffid=%s, eventtitle=%s, eventtype=%s,
                        starttime=%s, endtime=%s, eventstatus=%s, notes=%s
                    WHERE eventid=%s
                    """,
                    (
                        payload["residentid"], payload["staffid"], payload["eventtitle"], payload["eventtype"],
                        payload["starttime"], payload["endtime"], payload["eventstatus"], payload["notes"], payload["eventid"],
                    ),
                )
                return payload["eventid"]
            cursor.execute(
                """
                INSERT INTO scheduleevent
                    (residentid, staffid, eventtitle, eventtype, starttime, endtime, eventstatus, createdby, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    payload["residentid"], payload["staffid"], payload["eventtitle"], payload["eventtype"],
                    payload["starttime"], payload["endtime"], payload["eventstatus"],
                    actor["accountId"] if actor else None,
                    payload["notes"],
                ),
            )
            return cursor.lastrowid

        event_id = execute_transaction(transaction)
        flash(f"Schedule event #{event_id} was saved.")
    except (DatabaseUnavailable, DemoValidationError) as error:
        flash(str(error))
    return redirect(url_for("schedule_board"))


@app.post("/schedule/<int:event_id>/complete")
def complete_schedule(event_id):
    try:
        ensure_group_demo_schema()
        note = request.form.get("completionnote", "Completed during care workflow").strip()
        actor = current_account()

        def transaction(cursor):
            cursor.execute("UPDATE scheduleevent SET eventstatus='Completed' WHERE eventid=%s", (event_id,))
            cursor.execute(
                "INSERT INTO completionlog (eventid, completedby, completionnote) VALUES (%s, %s, %s)",
                (event_id, actor["accountId"] if actor else None, note),
            )

        execute_transaction(transaction)
        flash(f"Schedule event #{event_id} was completed by {account_name(actor)}.")
    except DatabaseUnavailable as error:
        flash(str(error))
    return redirect(url_for("schedule_board"))


@app.post("/schedule/<int:event_id>/delete")
def delete_schedule(event_id):
    try:
        ensure_group_demo_schema()
        execute_transaction(lambda cursor: cursor.execute("DELETE FROM scheduleevent WHERE eventid=%s", (event_id,)))
        flash(f"Schedule event #{event_id} was deleted.")
    except DatabaseUnavailable as error:
        flash(str(error))
    return redirect(url_for("schedule_board"))


@app.get("/appointment-requests")
def appointment_requests():
    page, response = _page("appointmentRequests")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        filters = {
            "status": request.args.get("status", ""),
            "residentid": request.args.get("residentid", ""),
        }
        conditions = []
        params = []
        if filters["status"]:
            conditions.append("ar.appointmentstatus = %s")
            params.append(filters["status"])
        if filters["residentid"]:
            conditions.append("ar.residentid = %s")
            params.append(filters["residentid"])
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        appointments = fetch_all(
            f"""
            SELECT ar.*, r.fullname AS residentname, r.roomnumber,
                   f.fullname AS familyname, reviewer.fullname AS reviewername
            FROM appointmentrequest ar
            JOIN resident r ON r.residentid = ar.residentid
            JOIN account f ON f.accountid = ar.familyid
            LEFT JOIN account reviewer ON reviewer.accountid = ar.reviewedby
            {where_clause}
            ORDER BY ar.starttime DESC, ar.appointmentid DESC
            """,
            params,
        )
        metrics = fetch_one(
            """
            SELECT COUNT(*) AS total,
                   SUM(appointmentstatus='Pending') AS pendingcount,
                   SUM(appointmentstatus='Approved') AS approvedcount,
                   SUM(appointmentstatus='Rejected') AS rejectedcount
            FROM appointmentrequest
            """
        )
        return render_template(
            "pages/appointment-requests.html",
            page=page,
            appointments=appointments,
            filters=filters,
            metrics=metrics,
            **_schedule_options(),
        )
    except DatabaseUnavailable as error:
        return database_error_page("appointmentRequests", error)


@app.post("/appointment-requests/save")
def save_appointment():
    try:
        ensure_group_demo_schema()
        payload = {
            "residentid": request.form.get("residentid", "").strip(),
            "familyid": request.form.get("familyid", "").strip(),
            "appointmenttype": request.form.get("appointmenttype", "").strip(),
            "starttime": _datetime_value(request.form.get("starttime", "").strip()),
            "endtime": _datetime_value(request.form.get("endtime", "").strip()),
            "purpose": request.form.get("purpose", "").strip(),
        }
        validate_required(payload, ["residentid", "familyid", "appointmenttype", "starttime", "endtime"])
        execute_transaction(
            lambda cursor: cursor.execute(
                """
                INSERT INTO appointmentrequest
                    (residentid, familyid, appointmenttype, starttime, endtime, purpose)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    payload["residentid"], payload["familyid"], payload["appointmenttype"],
                    payload["starttime"], payload["endtime"], payload["purpose"],
                ),
            )
        )
        flash("Appointment request was submitted.")
    except (DatabaseUnavailable, DemoValidationError) as error:
        flash(str(error))
    return redirect(url_for("appointment_requests"))


@app.post("/appointment-requests/<int:appointment_id>/review")
def review_appointment(appointment_id):
    try:
        ensure_group_demo_schema()
        status = request.form.get("appointmentstatus", "Approved")
        comment = request.form.get("reviewcomment", "").strip()
        actor = current_account()
        execute_transaction(
            lambda cursor: cursor.execute(
                """
                UPDATE appointmentrequest
                SET appointmentstatus=%s, reviewedby=%s, reviewcomment=%s
                WHERE appointmentid=%s
                """,
                (status, actor["accountId"] if actor else None, comment, appointment_id),
            )
        )
        flash(f"Appointment request #{appointment_id} was marked {status}.")
    except DatabaseUnavailable as error:
        flash(str(error))
    return redirect(url_for("appointment_requests"))


@app.post("/appointment-requests/<int:appointment_id>/delete")
def delete_appointment(appointment_id):
    try:
        ensure_group_demo_schema()
        execute_transaction(lambda cursor: cursor.execute("DELETE FROM appointmentrequest WHERE appointmentid=%s", (appointment_id,)))
        flash(f"Appointment request #{appointment_id} was deleted.")
    except DatabaseUnavailable as error:
        flash(str(error))
    return redirect(url_for("appointment_requests"))


@app.get("/schedule-analytics")
def schedule_analytics():
    page, response = _page("scheduleAnalytics")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        event_type_rows = fetch_all("SELECT eventtype AS label, COUNT(*) AS value FROM scheduleevent GROUP BY eventtype ORDER BY value DESC")
        status_rows = fetch_all("SELECT eventstatus AS label, COUNT(*) AS value FROM scheduleevent GROUP BY eventstatus ORDER BY value DESC")
        appointment_rows = fetch_all("SELECT appointmentstatus AS label, COUNT(*) AS value FROM appointmentrequest GROUP BY appointmentstatus ORDER BY value DESC")
        daily_rows = fetch_all(
            """
            SELECT DATE(starttime) AS label, COUNT(*) AS value
            FROM scheduleevent
            GROUP BY DATE(starttime)
            ORDER BY DATE(starttime)
            LIMIT 7
            """
        )
        return render_template(
            "pages/schedule-analytics.html",
            page=page,
            event_type_rows=event_type_rows,
            status_rows=status_rows,
            appointment_rows=appointment_rows,
            daily_rows=daily_rows,
        )
    except DatabaseUnavailable as error:
        return database_error_page("scheduleAnalytics", error)


def _get_event(event_id):
    row = fetch_one(
        """
        SELECT se.*, r.fullname AS residentname, a.fullname AS staffname
        FROM scheduleevent se
        JOIN resident r ON r.residentid = se.residentid
        JOIN account a ON a.accountid = se.staffid
        WHERE se.eventid = %s
        """,
        (event_id,),
    )
    if not row:
        raise DemoNotFoundError("Schedule event was not found.")
    row["starttime"] = iso_datetime(row["starttime"]).replace(" ", "T")
    row["endtime"] = iso_datetime(row["endtime"]).replace(" ", "T")
    return row
