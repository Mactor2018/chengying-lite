# -*- encoding: utf-8 -*-

import secrets
import time

from flask import Blueprint, redirect, render_template, request, session, url_for

from app.db import DatabaseUnavailable
from app.email_service import EmailDeliveryError, send_password_reset_code
from app.personnel_repository import (
    ConflictError,
    ValidationError,
    authenticate_account,
    find_account_for_recovery,
    get_account_by_db_id,
    reset_account_password,
)


auth = Blueprint("auth", __name__)
RECOVERY_CODE_TTL_SECONDS = 600
RECOVERY_RESEND_COOLDOWN_SECONDS = 30
RECOVERY_SEND_TIMESTAMPS = {}


def current_account_id():
    return session.get("account_id")


def current_account():
    account_id = current_account_id()
    if not account_id:
        return None
    try:
        account = get_account_by_db_id(account_id)
    except DatabaseUnavailable:
        return None
    if not account or account.get("status") != "Active":
        session.pop("account_id", None)
        return None
    return account


@auth.get("/login")
def login_form():
    return render_template("login.html", error="", identifier=request.args.get("username", ""))


@auth.post("/login")
def login_submit():
    identifier = request.form.get("identifier", "")
    password = request.form.get("password", "")
    try:
        account = authenticate_account(identifier, password)
    except (ValidationError, ConflictError, DatabaseUnavailable) as error:
        return render_template("login.html", error=str(error), identifier=identifier), 400
    session["account_id"] = account["accountId"]
    return redirect(url_for("page", slug="personnel"))


@auth.get("/forgot-password")
def forgot_password_form():
    return render_template(
        "forgot-password.html",
        step="request",
        error="",
        notice="",
        identifier=request.args.get("username", ""),
        email="",
    )


@auth.post("/forgot-password")
def forgot_password_submit():
    step = request.form.get("step", "request")
    if step == "verify":
        return reset_password_submit()
    if step == "resend":
        return resend_recovery_code_submit()

    identifier = request.form.get("identifier", "")
    email = request.form.get("email", "")
    if not email.strip():
        return render_template(
            "forgot-password.html",
            step="request",
            error="Email is required",
            notice="",
            identifier=identifier,
            email=email,
        ), 400
    try:
        account = find_account_for_recovery(identifier)
        available_in = resend_available_in(email)
        if available_in > 0:
            raise ValidationError(f"Please wait {available_in}s before requesting another code.")
        recovery_code = send_recovery_code(email, account["username"] or identifier.strip())
    except (ValidationError, EmailDeliveryError, DatabaseUnavailable) as error:
        return render_template(
            "forgot-password.html",
            step="request",
            error=str(error),
            notice="",
            identifier=identifier,
            email=email,
        ), 400

    session["password_reset_account_id"] = account["accountId"]
    session["password_reset_identifier"] = identifier.strip()
    session["password_reset_email"] = email.strip()
    session["password_reset_code"] = recovery_code
    session["password_reset_expires_at"] = time.time() + RECOVERY_CODE_TTL_SECONDS
    session["password_reset_last_sent_at"] = time.time()
    return render_template(
        "forgot-password.html",
        step="verify",
        error="",
        notice="A verification code was sent to your recovery email.",
        identifier=identifier,
        email=email,
        resend_available_in=RECOVERY_RESEND_COOLDOWN_SECONDS,
    )


def reset_password_submit():
    account_id = session.get("password_reset_account_id")
    identifier = session.get("password_reset_identifier", "")
    email = session.get("password_reset_email", "")
    expected_code = session.get("password_reset_code", "")
    expires_at = float(session.get("password_reset_expires_at", 0) or 0)
    code = request.form.get("verification_code", "").strip()
    password = request.form.get("new_password", "")
    confirm_password = request.form.get("confirm_password", "")

    if not account_id:
        return render_template(
            "forgot-password.html",
            step="request",
            error="Recovery session expired. Start again.",
            notice="",
            identifier=identifier,
            email=email,
        ), 400
    if time.time() > expires_at:
        clear_password_reset_session()
        return render_template(
            "forgot-password.html",
            step="request",
            error="Verification code expired. Request a new code.",
            notice="",
            identifier=identifier,
            email=email,
        ), 400
    if code != expected_code:
        return render_template(
            "forgot-password.html",
            step="verify",
            error="Invalid verification code",
            notice="Enter the code sent to your recovery email.",
            identifier=identifier,
            email=email,
            resend_available_in=resend_available_in(email),
        ), 400
    if password != confirm_password:
        return render_template(
            "forgot-password.html",
            step="verify",
            error="New passwords do not match",
            notice="Enter the code sent to your recovery email.",
            identifier=identifier,
            email=email,
            resend_available_in=resend_available_in(email),
        ), 400

    try:
        reset_account_password(account_id, password)
    except (ValidationError, DatabaseUnavailable) as error:
        return render_template(
            "forgot-password.html",
            step="verify",
            error=str(error),
            notice="Enter the code sent to your recovery email.",
            identifier=identifier,
            email=email,
            resend_available_in=resend_available_in(email),
        ), 400

    clear_password_reset_session()
    return render_template(
        "login.html",
        error="",
        notice="Password reset. Sign in with your new password.",
        identifier=identifier,
    )


def resend_recovery_code_submit():
    account_id = session.get("password_reset_account_id")
    identifier = session.get("password_reset_identifier", "")
    email = session.get("password_reset_email", "")
    if not account_id or not email:
        return render_template(
            "forgot-password.html",
            step="request",
            error="Recovery session expired. Start again.",
            notice="",
            identifier=identifier,
            email=email,
        ), 400

    available_in = resend_available_in(email)
    if available_in > 0:
        return render_template(
            "forgot-password.html",
            step="verify",
            error=f"Please wait {available_in}s before requesting another code.",
            notice="",
            identifier=identifier,
            email=email,
            resend_available_in=available_in,
        ), 429

    try:
        account = get_account_by_db_id(account_id)
        if not account:
            raise ValidationError("Recovery session expired. Start again.")
        recovery_code = send_recovery_code(email, account["username"] or identifier)
    except (ValidationError, EmailDeliveryError, DatabaseUnavailable) as error:
        return render_template(
            "forgot-password.html",
            step="verify",
            error=str(error),
            notice="",
            identifier=identifier,
            email=email,
            resend_available_in=0,
        ), 400

    session["password_reset_code"] = recovery_code
    session["password_reset_expires_at"] = time.time() + RECOVERY_CODE_TTL_SECONDS
    session["password_reset_last_sent_at"] = time.time()
    return render_template(
        "forgot-password.html",
        step="verify",
        error="",
        notice="A new verification code was sent.",
        identifier=identifier,
        email=email,
        resend_available_in=RECOVERY_RESEND_COOLDOWN_SECONDS,
    )


def send_recovery_code(email, account_name):
    recovery_code = generate_recovery_code()
    send_password_reset_code(email.strip(), account_name, recovery_code)
    RECOVERY_SEND_TIMESTAMPS[normalize_email(email)] = time.time()
    return recovery_code


def resend_available_in(email):
    sent_at = max(
        float(session.get("password_reset_last_sent_at", 0) or 0),
        RECOVERY_SEND_TIMESTAMPS.get(normalize_email(email), 0),
    )
    remaining = RECOVERY_RESEND_COOLDOWN_SECONDS - int(time.time() - sent_at)
    return max(0, remaining)


def normalize_email(email):
    return (email or "").strip().lower()


def generate_recovery_code():
    return f"{secrets.randbelow(1000000):06d}"


def clear_password_reset_session():
    session.pop("password_reset_account_id", None)
    session.pop("password_reset_identifier", None)
    session.pop("password_reset_email", None)
    session.pop("password_reset_code", None)
    session.pop("password_reset_expires_at", None)
    session.pop("password_reset_last_sent_at", None)


@auth.get("/logout")
def logout():
    session.pop("account_id", None)
    return redirect(url_for("index"))
