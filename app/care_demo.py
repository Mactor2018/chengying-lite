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
    iso_date,
    json_dumps,
    residents_for_select,
    today_iso,
    validate_required,
    ensure_group_demo_schema,
)
from app.team_route_helpers import database_error_page, page_or_redirect


SHIFT_OPTIONS = ["Morning", "Afternoon", "Evening", "Night"]
MEAL_OPTIONS = ["Finished meal", "Finished most meal", "Partial meal", "Refused meal", "NPO / clinical hold"]
SLEEP_OPTIONS = ["Good", "Fair", "Restless", "Poor", "Daytime nap needed"]
MOOD_OPTIONS = ["Calm", "Happy", "Tired", "Anxious", "Agitated"]
ACTIVITY_OPTIONS = ["Joined group activity", "One-on-one activity", "Rested after lunch", "Speech practice completed", "Declined activity"]
HYGIENE_OPTIONS = ["Completed", "Assisted", "Partial assistance", "Refused", "Scheduled later"]
MOBILITY_OPTIONS = ["Independent", "Walking support", "Wheelchair transfer", "Fall-risk support", "Bed rest"]


def _care_page(key="care"):
    page, response = page_or_redirect(key)
    return page, response


def _care_options():
    return {
        "residents": residents_for_select(),
        "caregivers": accounts_for_select(["Caregiver", "Nurse"]),
        "shift_options": SHIFT_OPTIONS,
        "meal_options": MEAL_OPTIONS,
        "sleep_options": SLEEP_OPTIONS,
        "mood_options": MOOD_OPTIONS,
        "activity_options": ACTIVITY_OPTIONS,
        "hygiene_options": HYGIENE_OPTIONS,
        "mobility_options": MOBILITY_OPTIONS,
    }


def _record_payload(form):
    payload = {
        "residentid": form.get("residentid", "").strip(),
        "caregiverid": form.get("caregiverid", "").strip(),
        "caredate": form.get("caredate", "").strip(),
        "shift": form.get("shift", "").strip(),
        "mealstatus": form.get("mealstatus", "").strip(),
        "sleepstatus": form.get("sleepstatus", "").strip(),
        "moodstatus": form.get("moodstatus", "").strip(),
        "activityparticipation": form.get("activityparticipation", "").strip(),
        "hygienecare": form.get("hygienecare", "").strip(),
        "mobilitystatus": form.get("mobilitystatus", "").strip(),
        "carenotes": form.get("carenotes", "").strip(),
        "modificationreason": form.get("modificationreason", "").strip(),
    }
    validate_required(
        payload,
        [
            "residentid",
            "caregiverid",
            "caredate",
            "shift",
            "mealstatus",
            "sleepstatus",
            "moodstatus",
            "activityparticipation",
            "hygienecare",
            "mobilitystatus",
        ],
    )
    return payload


def _get_record(record_id):
    row = fetch_one(
        """
        SELECT cr.*, r.fullname AS residentname, r.roomnumber,
               a.fullname AS caregivername, a.rolename AS caregiverrole
        FROM carerecord cr
        JOIN resident r ON r.residentid = cr.residentid
        JOIN account a ON a.accountid = cr.caregiverid
        WHERE cr.recordid = %s
        """,
        (record_id,),
    )
    if not row:
        raise DemoNotFoundError("Care record was not found.")
    return row


@app.get("/care-records")
def care_records():
    page, response = _care_page("care")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        filters = {
            "residentid": request.args.get("residentid", ""),
            "caregiverid": request.args.get("caregiverid", ""),
            "startdate": request.args.get("startdate", ""),
            "enddate": request.args.get("enddate", ""),
            "shift": request.args.get("shift", ""),
            "moodstatus": request.args.get("moodstatus", ""),
            "recordstatus": request.args.get("recordstatus", "Active"),
            "keyword": request.args.get("keyword", "").strip(),
        }
        conditions = []
        params = []
        if filters["residentid"]:
            conditions.append("cr.residentid = %s")
            params.append(filters["residentid"])
        if filters["caregiverid"]:
            conditions.append("cr.caregiverid = %s")
            params.append(filters["caregiverid"])
        if filters["startdate"]:
            conditions.append("cr.caredate >= %s")
            params.append(filters["startdate"])
        if filters["enddate"]:
            conditions.append("cr.caredate <= %s")
            params.append(filters["enddate"])
        if filters["shift"]:
            conditions.append("cr.shift = %s")
            params.append(filters["shift"])
        if filters["moodstatus"]:
            conditions.append("cr.moodstatus = %s")
            params.append(filters["moodstatus"])
        if filters["recordstatus"] and filters["recordstatus"] != "All":
            conditions.append("cr.recordstatus = %s")
            params.append(filters["recordstatus"])
        if filters["keyword"]:
            conditions.append("(cr.carenotes LIKE %s OR r.fullname LIKE %s OR a.fullname LIKE %s)")
            keyword = f"%{filters['keyword']}%"
            params.extend([keyword, keyword, keyword])

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        records = fetch_all(
            f"""
            SELECT cr.*, r.fullname AS residentname, r.roomnumber,
                   a.fullname AS caregivername, a.rolename AS caregiverrole
            FROM carerecord cr
            JOIN resident r ON r.residentid = cr.residentid
            JOIN account a ON a.accountid = cr.caregiverid
            {where_clause}
            ORDER BY cr.caredate DESC, cr.updatedat DESC, cr.recordid DESC
            """,
            params,
        )
        metrics = fetch_one(
            """
            SELECT
                COUNT(*) AS total,
                SUM(recordstatus = 'Active') AS activecount,
                SUM(recordstatus = 'Deleted') AS deletedcount,
                SUM(caredate = CURDATE()) AS todaycount
            FROM carerecord
            """
        )
        return render_template(
            "pages/care-records.html",
            page=page,
            records=records,
            metrics=metrics,
            filters=filters,
            **_care_options(),
        )
    except DatabaseUnavailable as error:
        return database_error_page("care", error)


@app.route("/care-records/add", methods=["GET", "POST"])
def add_care_record():
    page, response = _care_page("care")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        record = {"caredate": today_iso()}
        errors = []
        if request.method == "POST":
            try:
                payload = _record_payload(request.form)

                def transaction(cursor):
                    cursor.execute(
                        """
                        INSERT INTO carerecord
                            (residentid, caregiverid, caredate, shift, mealstatus, sleepstatus, moodstatus,
                             activityparticipation, hygienecare, mobilitystatus, carenotes)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            payload["residentid"],
                            payload["caregiverid"],
                            payload["caredate"],
                            payload["shift"],
                            payload["mealstatus"],
                            payload["sleepstatus"],
                            payload["moodstatus"],
                            payload["activityparticipation"],
                            payload["hygienecare"],
                            payload["mobilitystatus"],
                            payload["carenotes"],
                        ),
                    )
                    record_id = cursor.lastrowid
                    cursor.execute(
                        """
                        INSERT INTO carerecordauditlog
                            (recordid, actiontype, oldvalue, newvalue, reason, changedby)
                        VALUES (%s, 'ADD', '', %s, %s, %s)
                        """,
                        (
                            record_id,
                            json_dumps(payload),
                            "New care record created during care documentation workflow",
                            account_name(current_account()),
                        ),
                    )
                    return record_id

                record_id = execute_transaction(transaction)
                flash(f"Care record #{record_id} was added.")
                return redirect(url_for("care_records"))
            except DemoValidationError as error:
                errors.append(str(error))
                record = dict(request.form)
        return render_template(
            "pages/care-record-form.html",
            page=page,
            mode="Add",
            record=record,
            errors=errors,
            form_action=url_for("add_care_record"),
            **_care_options(),
        )
    except DatabaseUnavailable as error:
        return database_error_page("care", error)


@app.route("/care-records/edit/<int:record_id>", methods=["GET", "POST"])
def edit_care_record(record_id):
    page, response = _care_page("care")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        record = _get_record(record_id)
        errors = []
        if record["recordstatus"] == "Deleted":
            flash("Deleted care records are read-only and cannot be modified.")
            return redirect(url_for("care_records", recordstatus="Deleted"))

        if request.method == "POST":
            try:
                payload = _record_payload(request.form)
                if not payload["modificationreason"]:
                    raise DemoValidationError("Modification reason is required.")
                old_record = _get_record(record_id)

                def transaction(cursor):
                    cursor.execute(
                        """
                        UPDATE carerecord
                        SET residentid=%s, caregiverid=%s, caredate=%s, shift=%s,
                            mealstatus=%s, sleepstatus=%s, moodstatus=%s,
                            activityparticipation=%s, hygienecare=%s, mobilitystatus=%s,
                            carenotes=%s
                        WHERE recordid=%s AND recordstatus='Active'
                        """,
                        (
                            payload["residentid"],
                            payload["caregiverid"],
                            payload["caredate"],
                            payload["shift"],
                            payload["mealstatus"],
                            payload["sleepstatus"],
                            payload["moodstatus"],
                            payload["activityparticipation"],
                            payload["hygienecare"],
                            payload["mobilitystatus"],
                            payload["carenotes"],
                            record_id,
                        ),
                    )
                    cursor.execute(
                        """
                        INSERT INTO carerecordauditlog
                            (recordid, actiontype, oldvalue, newvalue, reason, changedby)
                        VALUES (%s, 'MODIFY', %s, %s, %s, %s)
                        """,
                        (
                            record_id,
                            json_dumps(old_record),
                            json_dumps(payload),
                            payload["modificationreason"],
                            account_name(current_account()),
                        ),
                    )

                execute_transaction(transaction)
                flash(f"Care record #{record_id} was updated.")
                return redirect(url_for("care_records"))
            except DemoValidationError as error:
                errors.append(str(error))
                record = dict(request.form)
                record["recordid"] = record_id

        return render_template(
            "pages/care-record-form.html",
            page=page,
            mode="Modify",
            record=record,
            errors=errors,
            form_action=url_for("edit_care_record", record_id=record_id),
            **_care_options(),
        )
    except (DatabaseUnavailable, DemoNotFoundError) as error:
        if isinstance(error, DatabaseUnavailable):
            return database_error_page("care", error)
        flash(str(error))
        return redirect(url_for("care_records"))


@app.route("/care-records/delete/<int:record_id>", methods=["GET", "POST"])
def delete_care_record(record_id):
    page, response = _care_page("care")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        record = _get_record(record_id)
        errors = []
        if record["recordstatus"] == "Deleted":
            flash("This care record has already been deleted.")
            return redirect(url_for("care_records", recordstatus="Deleted"))

        if request.method == "POST":
            reason = request.form.get("deletionreason", "").strip()
            if not reason:
                errors.append("Deletion reason is required.")
            else:
                old_record = _get_record(record_id)

                def transaction(cursor):
                    cursor.execute(
                        """
                        UPDATE carerecord
                        SET recordstatus='Deleted', deletionreason=%s, deletedat=NOW()
                        WHERE recordid=%s AND recordstatus='Active'
                        """,
                        (reason, record_id),
                    )
                    cursor.execute(
                        """
                        INSERT INTO carerecordauditlog
                            (recordid, actiontype, oldvalue, newvalue, reason, changedby)
                        VALUES (%s, 'DELETE', %s, %s, %s, %s)
                        """,
                        (
                            record_id,
                            json_dumps(old_record),
                            "Soft deleted",
                            reason,
                            account_name(current_account()),
                        ),
                    )

                execute_transaction(transaction)
                flash(f"Care record #{record_id} was soft deleted.")
                return redirect(url_for("care_records", recordstatus="All"))

        return render_template(
            "pages/care-record-delete.html",
            page=page,
            record=record,
            errors=errors,
        )
    except (DatabaseUnavailable, DemoNotFoundError) as error:
        if isinstance(error, DatabaseUnavailable):
            return database_error_page("care", error)
        flash(str(error))
        return redirect(url_for("care_records"))


@app.get("/care-records/chart")
def care_record_chart():
    page, response = _care_page("care")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        filters = {
            "residentid": request.args.get("residentid", ""),
            "startdate": request.args.get("startdate", ""),
            "enddate": request.args.get("enddate", ""),
        }
        conditions = ["recordstatus = 'Active'"]
        params = []
        if filters["residentid"]:
            conditions.append("residentid = %s")
            params.append(filters["residentid"])
        if filters["startdate"]:
            conditions.append("caredate >= %s")
            params.append(filters["startdate"])
        if filters["enddate"]:
            conditions.append("caredate <= %s")
            params.append(filters["enddate"])
        where_clause = "WHERE " + " AND ".join(conditions)

        mood_rows = fetch_all(
            f"SELECT moodstatus AS label, COUNT(*) AS value FROM carerecord {where_clause} GROUP BY moodstatus ORDER BY value DESC",
            params,
        )
        meal_rows = fetch_all(
            f"SELECT mealstatus AS label, COUNT(*) AS value FROM carerecord {where_clause} GROUP BY mealstatus ORDER BY value DESC",
            params,
        )
        shift_rows = fetch_all(
            f"SELECT shift AS label, COUNT(*) AS value FROM carerecord {where_clause} GROUP BY shift ORDER BY FIELD(shift, 'Morning', 'Afternoon', 'Evening', 'Night')",
            params,
        )
        return render_template(
            "pages/care-record-chart.html",
            page=page,
            filters=filters,
            residents=residents_for_select(),
            mood_rows=mood_rows,
            meal_rows=meal_rows,
            shift_rows=shift_rows,
        )
    except DatabaseUnavailable as error:
        return database_error_page("care", error)
