# -*- encoding: utf-8 -*-

from flask import flash, redirect, render_template, request, url_for

from app import app
from app.auth import current_account
from app.db import DatabaseUnavailable
from app.group_demo_db import (
    DemoValidationError,
    account_name,
    accounts_for_select,
    execute_transaction,
    fetch_all,
    fetch_one,
    residents_for_select,
    validate_required,
    ensure_group_demo_schema,
)
from app.team_route_helpers import database_error_page, page_or_redirect


CONVERSATION_TYPES = ["Family Care Update", "Service Follow-up", "Clinical Coordination", "Daily Report Question"]
CONVERSATION_STATUSES = ["Open", "Waiting", "Closed"]
INQUIRY_STATUSES = ["Open", "In Progress", "Resolved", "Closed"]
PRIORITIES = ["Low", "Medium", "High", "Urgent"]


def _page(key):
    return page_or_redirect(key)


def _communication_options():
    return {
        "residents": residents_for_select(),
        "staff_accounts": accounts_for_select(["Nursing Supervisor", "Nurse", "Doctor", "Caregiver"]),
        "family_accounts": accounts_for_select(["Family Member"]),
        "conversation_types": CONVERSATION_TYPES,
        "conversation_statuses": CONVERSATION_STATUSES,
        "inquiry_statuses": INQUIRY_STATUSES,
        "priorities": PRIORITIES,
    }


@app.get("/conversations")
def conversations():
    page, response = _page("conversations")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        filters = {
            "residentid": request.args.get("residentid", ""),
            "status": request.args.get("status", ""),
            "keyword": request.args.get("keyword", "").strip(),
        }
        conditions = []
        params = []
        if filters["residentid"]:
            conditions.append("c.residentid = %s")
            params.append(filters["residentid"])
        if filters["status"]:
            conditions.append("c.conversationstatus = %s")
            params.append(filters["status"])
        if filters["keyword"]:
            conditions.append("(c.title LIKE %s OR r.fullname LIKE %s)")
            keyword = f"%{filters['keyword']}%"
            params.extend([keyword, keyword])
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        rows = fetch_all(
            f"""
            SELECT c.*, r.fullname AS residentname, r.roomnumber,
                   creator.fullname AS creatorname,
                   COUNT(DISTINCT p.participantid) AS participantcount,
                   COUNT(DISTINCT m.messageid) AS messagecount,
                   SUM(COALESCE(m.unreadflag, 0)) AS unreadcount
            FROM conversation c
            JOIN resident r ON r.residentid = c.residentid
            LEFT JOIN account creator ON creator.accountid = c.createdby
            LEFT JOIN participant p ON p.conversationid = c.conversationid
            LEFT JOIN chatmessage m ON m.conversationid = c.conversationid
            {where_clause}
            GROUP BY c.conversationid, r.fullname, r.roomnumber, creator.fullname
            ORDER BY c.updatedat DESC, c.conversationid DESC
            """,
            params,
        )
        metrics = fetch_one(
            """
            SELECT COUNT(*) AS total,
                   SUM(conversationstatus='Open') AS opencount,
                   SUM(conversationstatus='Waiting') AS waitingcount,
                   SUM(conversationstatus='Closed') AS closedcount
            FROM conversation
            """
        )
        return render_template(
            "pages/conversations.html",
            page=page,
            conversations=rows,
            filters=filters,
            metrics=metrics,
            **_communication_options(),
        )
    except DatabaseUnavailable as error:
        return database_error_page("conversations", error)


@app.post("/conversations/create")
def create_conversation():
    try:
        ensure_group_demo_schema()
        payload = {
            "residentid": request.form.get("residentid", "").strip(),
            "conversationtype": request.form.get("conversationtype", "").strip(),
            "title": request.form.get("title", "").strip(),
            "participantid": request.form.get("participantid", "").strip(),
            "firstmessage": request.form.get("firstmessage", "").strip(),
        }
        validate_required(payload, ["residentid", "conversationtype", "title"])
        actor = current_account()

        def transaction(cursor):
            cursor.execute(
                """
                INSERT INTO conversation (residentid, conversationtype, title, createdby)
                VALUES (%s, %s, %s, %s)
                """,
                (payload["residentid"], payload["conversationtype"], payload["title"], actor["accountId"] if actor else None),
            )
            conversation_id = cursor.lastrowid
            if actor:
                cursor.execute(
                    "INSERT IGNORE INTO participant (conversationid, accountid, participantrole) VALUES (%s, %s, %s)",
                    (conversation_id, actor["accountId"], actor["role"]),
                )
            if payload["participantid"]:
                cursor.execute(
                    "INSERT IGNORE INTO participant (conversationid, accountid, participantrole) VALUES (%s, %s, 'Care Team')",
                    (conversation_id, payload["participantid"]),
                )
            if payload["firstmessage"]:
                cursor.execute(
                    "INSERT INTO chatmessage (conversationid, senderid, messagetext, unreadflag) VALUES (%s, %s, %s, 1)",
                    (conversation_id, actor["accountId"] if actor else None, payload["firstmessage"]),
                )
            return conversation_id

        conversation_id = execute_transaction(transaction)
        flash(f"Conversation #{conversation_id} was created.")
        return redirect(url_for("conversation_detail", conversationid=conversation_id))
    except (DatabaseUnavailable, DemoValidationError) as error:
        flash(str(error))
        return redirect(url_for("conversations"))


@app.post("/conversations/<int:conversation_id>/status")
def update_conversation_status(conversation_id):
    try:
        ensure_group_demo_schema()
        status = request.form.get("conversationstatus", "Open")
        execute_transaction(
            lambda cursor: cursor.execute(
                "UPDATE conversation SET conversationstatus=%s WHERE conversationid=%s",
                (status, conversation_id),
            )
        )
        flash(f"Conversation #{conversation_id} status changed to {status}.")
    except DatabaseUnavailable as error:
        flash(str(error))
    return redirect(url_for("conversations"))


@app.post("/conversations/<int:conversation_id>/delete")
def delete_conversation(conversation_id):
    try:
        ensure_group_demo_schema()
        execute_transaction(lambda cursor: cursor.execute("DELETE FROM conversation WHERE conversationid=%s", (conversation_id,)))
        flash(f"Conversation #{conversation_id} was deleted.")
    except DatabaseUnavailable as error:
        flash(str(error))
    return redirect(url_for("conversations"))


@app.get("/conversation-detail")
def conversation_detail():
    page, response = _page("conversationDetail")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        conversation_id = request.args.get("conversationid")
        if not conversation_id:
            first = fetch_one("SELECT conversationid FROM conversation ORDER BY updatedat DESC, conversationid DESC LIMIT 1")
            conversation_id = first["conversationid"] if first else None
        conversation = None
        messages = []
        participants = []
        if conversation_id:
            conversation = fetch_one(
                """
                SELECT c.*, r.fullname AS residentname, r.roomnumber, r.carelevel,
                       creator.fullname AS creatorname
                FROM conversation c
                JOIN resident r ON r.residentid = c.residentid
                LEFT JOIN account creator ON creator.accountid = c.createdby
                WHERE c.conversationid = %s
                """,
                (conversation_id,),
            )
            messages = fetch_all(
                """
                SELECT m.*, a.fullname AS sendername, a.rolename AS senderrole
                FROM chatmessage m
                LEFT JOIN account a ON a.accountid = m.senderid
                WHERE m.conversationid = %s
                ORDER BY m.sentat, m.messageid
                """,
                (conversation_id,),
            )
            participants = fetch_all(
                """
                SELECT p.*, a.fullname, a.rolename
                FROM participant p
                JOIN account a ON a.accountid = p.accountid
                WHERE p.conversationid = %s
                ORDER BY a.rolename, a.fullname
                """,
                (conversation_id,),
            )
        conversation_list = fetch_all(
            """
            SELECT c.conversationid, c.title, c.conversationstatus, r.fullname AS residentname
            FROM conversation c
            JOIN resident r ON r.residentid = c.residentid
            ORDER BY c.updatedat DESC, c.conversationid DESC
            """
        )
        return render_template(
            "pages/conversation-detail.html",
            page=page,
            conversation=conversation,
            messages=messages,
            participants=participants,
            conversation_list=conversation_list,
        )
    except DatabaseUnavailable as error:
        return database_error_page("conversationDetail", error)


@app.post("/conversation-detail/<int:conversation_id>/messages")
def send_conversation_message(conversation_id):
    try:
        ensure_group_demo_schema()
        text = request.form.get("messagetext", "").strip()
        if not text:
            raise DemoValidationError("Message text is required.")
        actor = current_account()

        def transaction(cursor):
            cursor.execute(
                "INSERT INTO chatmessage (conversationid, senderid, messagetext, unreadflag) VALUES (%s, %s, %s, 1)",
                (conversation_id, actor["accountId"] if actor else None, text),
            )
            cursor.execute("UPDATE conversation SET updatedat = NOW() WHERE conversationid=%s", (conversation_id,))

        execute_transaction(transaction)
        flash("Message was sent.")
    except (DatabaseUnavailable, DemoValidationError) as error:
        flash(str(error))
    return redirect(url_for("conversation_detail", conversationid=conversation_id))


@app.get("/service-inquiries")
def service_inquiries():
    page, response = _page("serviceInquiries")
    if response:
        return response
    try:
        ensure_group_demo_schema()
        filters = {
            "status": request.args.get("status", ""),
            "priority": request.args.get("priority", ""),
            "residentid": request.args.get("residentid", ""),
            "keyword": request.args.get("keyword", "").strip(),
        }
        conditions = []
        params = []
        if filters["status"]:
            conditions.append("si.inquirystatus = %s")
            params.append(filters["status"])
        if filters["priority"]:
            conditions.append("si.priority = %s")
            params.append(filters["priority"])
        if filters["residentid"]:
            conditions.append("si.residentid = %s")
            params.append(filters["residentid"])
        if filters["keyword"]:
            conditions.append("(si.title LIKE %s OR si.description LIKE %s OR r.fullname LIKE %s)")
            keyword = f"%{filters['keyword']}%"
            params.extend([keyword, keyword, keyword])
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        inquiries = fetch_all(
            f"""
            SELECT si.*, r.fullname AS residentname, r.roomnumber,
                   creator.fullname AS creatorname, assigned.fullname AS assignedname
            FROM serviceinquiry si
            JOIN resident r ON r.residentid = si.residentid
            LEFT JOIN account creator ON creator.accountid = si.createdby
            LEFT JOIN account assigned ON assigned.accountid = si.assignedto
            {where_clause}
            ORDER BY FIELD(si.priority, 'Urgent', 'High', 'Medium', 'Low'), si.updatedat DESC
            """,
            params,
        )
        metrics = fetch_one(
            """
            SELECT COUNT(*) AS total,
                   SUM(inquirystatus='Open') AS opencount,
                   SUM(inquirystatus='In Progress') AS progresscount,
                   SUM(inquirystatus='Resolved') AS resolvedcount
            FROM serviceinquiry
            """
        )
        return render_template(
            "pages/service-inquiries.html",
            page=page,
            inquiries=inquiries,
            filters=filters,
            metrics=metrics,
            **_communication_options(),
        )
    except DatabaseUnavailable as error:
        return database_error_page("serviceInquiries", error)


@app.post("/service-inquiries/create")
def create_service_inquiry():
    try:
        ensure_group_demo_schema()
        payload = {
            "residentid": request.form.get("residentid", "").strip(),
            "title": request.form.get("title", "").strip(),
            "description": request.form.get("description", "").strip(),
            "priority": request.form.get("priority", "Medium").strip(),
            "assignedto": request.form.get("assignedto", "").strip() or None,
        }
        validate_required(payload, ["residentid", "title", "priority"])
        actor = current_account()
        execute_transaction(
            lambda cursor: cursor.execute(
                """
                INSERT INTO serviceinquiry
                    (residentid, title, description, priority, createdby, assignedto)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    payload["residentid"], payload["title"], payload["description"], payload["priority"],
                    actor["accountId"] if actor else None,
                    payload["assignedto"],
                ),
            )
        )
        flash("Service inquiry was created.")
    except (DatabaseUnavailable, DemoValidationError) as error:
        flash(str(error))
    return redirect(url_for("service_inquiries"))


@app.post("/service-inquiries/<int:inquiry_id>/update")
def update_service_inquiry(inquiry_id):
    try:
        ensure_group_demo_schema()
        status = request.form.get("inquirystatus", "Open")
        assignedto = request.form.get("assignedto", "").strip() or None
        note = request.form.get("resolutionnote", "").strip()
        execute_transaction(
            lambda cursor: cursor.execute(
                """
                UPDATE serviceinquiry
                SET inquirystatus=%s, assignedto=%s, resolutionnote=%s
                WHERE inquiryid=%s
                """,
                (status, assignedto, note, inquiry_id),
            )
        )
        flash(f"Service inquiry #{inquiry_id} was updated.")
    except DatabaseUnavailable as error:
        flash(str(error))
    return redirect(url_for("service_inquiries"))


@app.post("/service-inquiries/<int:inquiry_id>/delete")
def delete_service_inquiry(inquiry_id):
    try:
        ensure_group_demo_schema()
        execute_transaction(lambda cursor: cursor.execute("DELETE FROM serviceinquiry WHERE inquiryid=%s", (inquiry_id,)))
        flash(f"Service inquiry #{inquiry_id} was deleted.")
    except DatabaseUnavailable as error:
        flash(str(error))
    return redirect(url_for("service_inquiries"))
