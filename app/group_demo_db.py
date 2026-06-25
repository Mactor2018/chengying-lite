# -*- encoding: utf-8 -*-

from contextlib import contextmanager
from datetime import date, datetime, timedelta
import json

from app.db import DatabaseUnavailable, get_connection


class DemoValidationError(Exception):
    pass


class DemoNotFoundError(Exception):
    pass


_schema_ready = False


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


def fetch_all(sql, params=None):
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, params or ())
        return cursor.fetchall()


def fetch_one(sql, params=None):
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, params or ())
        return cursor.fetchone()


def execute_write(sql, params=None):
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, params or ())
        return cursor.lastrowid


def execute_transaction(callback):
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        return callback(cursor)


def validate_required(payload, fields):
    missing = [field for field in fields if payload.get(field) in (None, "")]
    if missing:
        raise DemoValidationError("Please complete: " + ", ".join(missing))


def parse_int(value, label, required=True):
    if value in (None, ""):
        if required:
            raise DemoValidationError(f"{label} is required")
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError) as error:
        raise DemoValidationError(f"{label} must be a valid number") from error
    return parsed


def parse_decimal(value, label, required=True):
    if value in (None, ""):
        if required:
            raise DemoValidationError(f"{label} is required")
        return None
    try:
        return float(value)
    except (TypeError, ValueError) as error:
        raise DemoValidationError(f"{label} must be a valid number") from error


def iso_date(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()[:10]
    return str(value) if value is not None else ""


def iso_datetime(value):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M")
    return str(value)[:16] if value is not None else ""


def today_iso():
    return date.today().isoformat()


def upcoming_date(days):
    return (date.today() + timedelta(days=days)).isoformat()


def json_dumps(value):
    return json.dumps(value, default=str, ensure_ascii=False)


def ensure_group_demo_schema():
    global _schema_ready
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        if _schema_ready:
            cursor.execute("SHOW TABLES LIKE 'carerecord'")
            if cursor.fetchone():
                return
            _schema_ready = False

        cursor.execute("SHOW TABLES LIKE 'account'")
        if not cursor.fetchone():
            raise DatabaseUnavailable(
                "The Jianning base tables are missing. Load database/schema.sql and database/seed.sql first."
            )

        for statement in GROUP_DEMO_TABLES:
            cursor.execute(statement)

        _seed_schedule(cursor)
        _seed_communication(cursor)
        _seed_care_records(cursor)
        _schema_ready = True


def residents_for_select():
    ensure_group_demo_schema()
    return fetch_all(
        """
        SELECT residentid, fullname, roomnumber, carelevel
        FROM resident
        WHERE residentstatus = 'Active'
        ORDER BY fullname
        """
    )


def accounts_for_select(roles=None):
    ensure_group_demo_schema()
    params = []
    where = ["accountstatus = 'Active'"]
    if roles:
        placeholders = ", ".join(["%s"] * len(roles))
        where.append(f"rolename IN ({placeholders})")
        params.extend(roles)
    return fetch_all(
        f"""
        SELECT accountid, fullname, username, rolename, department
        FROM account
        WHERE {' AND '.join(where)}
        ORDER BY rolename, fullname
        """,
        params,
    )


def account_name(account):
    if not account:
        return "Demo User"
    return account.get("name") or account.get("username") or "Demo User"


def _count_rows(cursor, table_name):
    cursor.execute(f"SELECT COUNT(*) AS total FROM {table_name}")
    return cursor.fetchone()["total"]


def _seed_schedule(cursor):
    if _count_rows(cursor, "scheduleevent"):
        return

    cursor.executemany(
        """
        INSERT INTO appointmentrequest
            (residentid, familyid, appointmenttype, starttime, endtime, purpose, appointmentstatus, reviewedby, reviewcomment)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        [
            (1, 16, "Video Call", f"{upcoming_date(1)} 10:00:00", f"{upcoming_date(1)} 10:30:00", "Weekly family check-in", "Approved", 2, "Fits the resident's morning routine."),
            (2, 17, "Family Visit", f"{upcoming_date(2)} 14:00:00", f"{upcoming_date(2)} 15:00:00", "Discuss nutrition plan with caregiver", "Pending", None, ""),
            (3, 18, "Video Call", f"{upcoming_date(3)} 16:00:00", f"{upcoming_date(3)} 16:30:00", "Speech therapy progress conversation", "Approved", 2, "Approved for afternoon."),
        ],
    )

    cursor.executemany(
        """
        INSERT INTO scheduleevent
            (residentid, staffid, eventtitle, eventtype, starttime, endtime, eventstatus, sourceappointmentid, createdby, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        [
            (1, 6, "Morning mobility support", "Care Task", f"{today_iso()} 09:00:00", f"{today_iso()} 09:30:00", "Scheduled", None, 1, "Assist Eleanor with hallway walking practice."),
            (2, 3, "Blood sugar check", "Clinical Check", f"{today_iso()} 11:00:00", f"{today_iso()} 11:15:00", "Scheduled", None, 1, "Record glucose reading before lunch."),
            (3, 8, "Speech practice and activity room", "Activity", f"{upcoming_date(1)} 13:30:00", f"{upcoming_date(1)} 14:15:00", "Scheduled", None, 1, "Coordinate with rehabilitation notes."),
            (1, 6, "Family video call", "Appointment", f"{upcoming_date(1)} 10:00:00", f"{upcoming_date(1)} 10:30:00", "Scheduled", 1, 2, "Generated from approved appointment request."),
        ],
    )


def _seed_communication(cursor):
    if _count_rows(cursor, "conversation"):
        return

    cursor.executemany(
        """
        INSERT INTO conversation
            (residentid, conversationtype, title, conversationstatus, createdby)
        VALUES (%s, %s, %s, %s, %s)
        """,
        [
            (1, "Family Care Update", "Eleanor morning care update", "Open", 16),
            (2, "Service Follow-up", "Robert nutrition question", "Open", 17),
            (3, "Clinical Coordination", "Helen therapy schedule", "Open", 3),
        ],
    )

    cursor.executemany(
        """
        INSERT INTO participant (conversationid, accountid, participantrole)
        VALUES (%s, %s, %s)
        """,
        [
            (1, 16, "Family"), (1, 6, "Caregiver"), (1, 3, "Nurse"),
            (2, 17, "Family"), (2, 7, "Caregiver"), (2, 13, "Doctor"),
            (3, 18, "Family"), (3, 5, "Nurse"), (3, 11, "Doctor"),
        ],
    )

    cursor.executemany(
        """
        INSERT INTO chatmessage (conversationid, senderid, messagetext, unreadflag)
        VALUES (%s, %s, %s, %s)
        """,
        [
            (1, 16, "Good morning. Can you share how Mom did with breakfast today?", 1),
            (1, 6, "She finished most of her breakfast and joined the hallway walk.", 0),
            (2, 17, "Can Robert's lunch sugar level be monitored today?", 1),
            (3, 5, "Helen completed her morning speech practice and will rest before the afternoon session.", 0),
        ],
    )

    cursor.executemany(
        """
        INSERT INTO serviceinquiry
            (residentid, conversationid, title, description, inquirystatus, priority, createdby, assignedto)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        [
            (1, 1, "Breakfast and walking update", "Family requested a short update after breakfast.", "Resolved", "Low", 16, 6),
            (2, 2, "Nutrition plan question", "Family asked whether today's lunch can support diabetes monitoring.", "In Progress", "High", 17, 13),
            (3, 3, "Therapy schedule confirmation", "Confirm afternoon speech therapy timing with the family.", "Open", "Medium", 18, 5),
        ],
    )


def _seed_care_records(cursor):
    if _count_rows(cursor, "carerecord"):
        return

    cursor.executemany(
        """
        INSERT INTO carerecord
            (residentid, caregiverid, caredate, shift, mealstatus, sleepstatus, moodstatus,
             activityparticipation, hygienecare, mobilitystatus, carenotes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        [
            (1, 6, today_iso(), "Morning", "Finished most meal", "Good", "Calm", "Joined group activity", "Completed", "Walking support", "Resident completed a hallway walk with one-person support."),
            (2, 7, today_iso(), "Afternoon", "Partial meal", "Fair", "Tired", "Rested after lunch", "Completed", "Wheelchair transfer", "Blood sugar reminder added for nurse follow-up."),
            (3, 8, upcoming_date(-1), "Evening", "Finished meal", "Restless", "Anxious", "Speech practice completed", "Assisted", "Fall-risk support", "Resident benefited from quiet-room redirection before bedtime."),
        ],
    )

    cursor.executemany(
        """
        INSERT INTO carerecordauditlog
            (recordid, actiontype, oldvalue, newvalue, reason, changedby)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        [
            (1, "ADD", "", "Seeded morning care record", "Initial demo record", "System"),
            (2, "ADD", "", "Seeded afternoon care record", "Initial demo record", "System"),
            (3, "ADD", "", "Seeded evening care record", "Initial demo record", "System"),
        ],
    )


GROUP_DEMO_TABLES = [
    """
    CREATE TABLE IF NOT EXISTS appointmentrequest (
        appointmentid INT PRIMARY KEY AUTO_INCREMENT,
        residentid INT NOT NULL,
        familyid INT NOT NULL,
        appointmenttype VARCHAR(50) NOT NULL,
        starttime DATETIME NOT NULL,
        endtime DATETIME NOT NULL,
        purpose TEXT,
        appointmentstatus VARCHAR(30) NOT NULL DEFAULT 'Pending',
        reviewedby INT NULL,
        reviewcomment TEXT,
        createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
        FOREIGN KEY (familyid) REFERENCES account(accountid) ON DELETE CASCADE,
        FOREIGN KEY (reviewedby) REFERENCES account(accountid) ON DELETE SET NULL
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS scheduleevent (
        eventid INT PRIMARY KEY AUTO_INCREMENT,
        residentid INT NOT NULL,
        staffid INT NOT NULL,
        eventtitle VARCHAR(120) NOT NULL,
        eventtype VARCHAR(50) NOT NULL,
        starttime DATETIME NOT NULL,
        endtime DATETIME NOT NULL,
        eventstatus VARCHAR(30) NOT NULL DEFAULT 'Scheduled',
        sourceappointmentid INT NULL,
        createdby INT NULL,
        notes TEXT,
        createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
        FOREIGN KEY (staffid) REFERENCES account(accountid) ON DELETE CASCADE,
        FOREIGN KEY (sourceappointmentid) REFERENCES appointmentrequest(appointmentid) ON DELETE SET NULL,
        FOREIGN KEY (createdby) REFERENCES account(accountid) ON DELETE SET NULL
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS completionlog (
        completionid INT PRIMARY KEY AUTO_INCREMENT,
        eventid INT NOT NULL,
        completedby INT NULL,
        completedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completionnote TEXT,
        FOREIGN KEY (eventid) REFERENCES scheduleevent(eventid) ON DELETE CASCADE,
        FOREIGN KEY (completedby) REFERENCES account(accountid) ON DELETE SET NULL
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS conversation (
        conversationid INT PRIMARY KEY AUTO_INCREMENT,
        residentid INT NOT NULL,
        conversationtype VARCHAR(60) NOT NULL,
        title VARCHAR(150) NOT NULL,
        conversationstatus VARCHAR(30) NOT NULL DEFAULT 'Open',
        createdby INT NULL,
        createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
        FOREIGN KEY (createdby) REFERENCES account(accountid) ON DELETE SET NULL
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS participant (
        participantid INT PRIMARY KEY AUTO_INCREMENT,
        conversationid INT NOT NULL,
        accountid INT NOT NULL,
        participantrole VARCHAR(50) NOT NULL,
        joinedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_participant_conversation_account (conversationid, accountid),
        FOREIGN KEY (conversationid) REFERENCES conversation(conversationid) ON DELETE CASCADE,
        FOREIGN KEY (accountid) REFERENCES account(accountid) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS chatmessage (
        messageid INT PRIMARY KEY AUTO_INCREMENT,
        conversationid INT NOT NULL,
        senderid INT NULL,
        messagetext TEXT NOT NULL,
        unreadflag TINYINT(1) NOT NULL DEFAULT 1,
        sentat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversationid) REFERENCES conversation(conversationid) ON DELETE CASCADE,
        FOREIGN KEY (senderid) REFERENCES account(accountid) ON DELETE SET NULL
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS serviceinquiry (
        inquiryid INT PRIMARY KEY AUTO_INCREMENT,
        residentid INT NOT NULL,
        conversationid INT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        inquirystatus VARCHAR(30) NOT NULL DEFAULT 'Open',
        priority VARCHAR(30) NOT NULL DEFAULT 'Medium',
        createdby INT NULL,
        assignedto INT NULL,
        resolutionnote TEXT,
        createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
        FOREIGN KEY (conversationid) REFERENCES conversation(conversationid) ON DELETE SET NULL,
        FOREIGN KEY (createdby) REFERENCES account(accountid) ON DELETE SET NULL,
        FOREIGN KEY (assignedto) REFERENCES account(accountid) ON DELETE SET NULL
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS carerecord (
        recordid INT PRIMARY KEY AUTO_INCREMENT,
        residentid INT NOT NULL,
        caregiverid INT NOT NULL,
        caredate DATE NOT NULL,
        shift VARCHAR(30) NOT NULL,
        mealstatus VARCHAR(80) NOT NULL,
        sleepstatus VARCHAR(80) NOT NULL,
        moodstatus VARCHAR(80) NOT NULL,
        activityparticipation VARCHAR(100) NOT NULL,
        hygienecare VARCHAR(80) NOT NULL,
        mobilitystatus VARCHAR(100) NOT NULL,
        carenotes TEXT,
        recordstatus VARCHAR(30) NOT NULL DEFAULT 'Active',
        deletionreason TEXT,
        createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedat DATETIME NULL,
        FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
        FOREIGN KEY (caregiverid) REFERENCES account(accountid) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS carerecordauditlog (
        auditid INT PRIMARY KEY AUTO_INCREMENT,
        recordid INT NOT NULL,
        actiontype VARCHAR(30) NOT NULL,
        oldvalue TEXT,
        newvalue TEXT,
        reason TEXT,
        changedby VARCHAR(100),
        changedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recordid) REFERENCES carerecord(recordid) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """,
]
