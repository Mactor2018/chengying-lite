# -*- encoding: utf-8 -*-

from functools import wraps

from flask import Blueprint, jsonify, request, session

from app.auth import current_account_id
from app.db import DatabaseUnavailable
from app.personnel_ai import AIInsightError, generate_personnel_ai_insights
from app.personnel_repository import (
    ConflictError,
    NotFoundError,
    ValidationError,
    assign_account_to_resident,
    bind_family_account_to_resident,
    bootstrap_data,
    create_account,
    create_resident,
    create_self_family_account,
    create_self_friend,
    delete_account,
    delete_account_assignment,
    delete_family_binding,
    delete_resident,
    delete_self_family_account,
    delete_self_friend,
    get_account,
    get_account_by_db_id,
    get_resident,
    resident_delete_impact,
    connection_scope,
    can_view_resident_id,
    list_residents_for_account,
    list_account_records,
    parse_prefixed_id,
    update_account,
    update_account_status,
    update_family_binding,
    update_permissions,
    update_resident,
    update_staff_assignments,
)

personnel_api = Blueprint("personnel_api", __name__, url_prefix="/api/personnel")
RESIDENT_VIEW_ROLES = {"Admin", "Nursing Supervisor", "Nurse", "Doctor", "Caregiver", "Activity Staff"}


class UnauthorizedError(Exception):
    pass


class ForbiddenError(Exception):
    pass


def json_endpoint(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except ValidationError as error:
            return jsonify({"error": str(error)}), 400
        except ConflictError as error:
            return jsonify({"error": str(error)}), 409
        except NotFoundError as error:
            return jsonify({"error": str(error)}), 404
        except UnauthorizedError as error:
            return jsonify({"error": str(error)}), 401
        except ForbiddenError as error:
            return jsonify({"error": str(error)}), 403
        except DatabaseUnavailable as error:
            return jsonify({"error": "Database unavailable", "detail": str(error)}), 503
    return wrapper


def payload():
    return request.get_json(silent=True) or {}


def current_account_or_401():
    account_id = current_account_id()
    if not account_id:
        raise UnauthorizedError("Login required")
    account = get_account_by_db_id(account_id)
    if not account:
        raise UnauthorizedError("Login required")
    if account.get("status") != "Active":
        session.pop("account_id", None)
        raise UnauthorizedError("Account inactive or frozen")
    return account


def require_admin():
    account = current_account_or_401()
    if account["role"] != "Admin":
        raise ForbiddenError("Admin permission required")
    return account


def require_resident_viewer():
    account = current_account_or_401()
    if account["role"] not in RESIDENT_VIEW_ROLES:
        raise ForbiddenError("Resident page permission required")
    return account


def require_resident_visible(resident_id):
    account = require_resident_viewer()
    resident_db_id = parse_prefixed_id(resident_id, "r")
    with connection_scope() as connection:
        cursor = connection.cursor(dictionary=True)
        if not can_view_resident_id(cursor, account, resident_db_id):
            raise ForbiddenError("Resident is not assigned to this account")
    return account


def require_elderly_account():
    account = current_account_or_401()
    if account["role"] != "Elderly Resident":
        raise ForbiddenError("Elderly resident permission required")
    return account


@personnel_api.get("/bootstrap")
@json_endpoint
def bootstrap():
    account = current_account_or_401()
    return jsonify(bootstrap_data(account["accountId"]))


@personnel_api.post("/ai-insights")
@json_endpoint
def ai_insights():
    account = current_account_or_401()
    if account["role"] not in ("Admin", "Nursing Supervisor"):
        raise ForbiddenError("Personnel analytics permission required")
    try:
        insights = generate_personnel_ai_insights(bootstrap_data(account["accountId"]))
    except AIInsightError as error:
        return jsonify({"error": str(error)}), 503
    return jsonify({"insights": insights})


@personnel_api.get("/residents")
@json_endpoint
def residents_index():
    account = require_resident_viewer()
    return jsonify({"residents": list_residents_for_account(account["accountId"])})


@personnel_api.post("/residents")
@json_endpoint
def residents_create():
    require_admin()
    return jsonify({"resident": create_resident(payload())}), 201


@personnel_api.get("/residents/<resident_id>")
@json_endpoint
def residents_show(resident_id):
    require_resident_visible(resident_id)
    return jsonify({"resident": get_resident(resident_id)})


@personnel_api.get("/residents/<resident_id>/delete-impact")
@json_endpoint
def residents_delete_impact(resident_id):
    require_admin()
    return jsonify({"impact": resident_delete_impact(resident_id)})


@personnel_api.put("/residents/<resident_id>")
@json_endpoint
def residents_update(resident_id):
    require_admin()
    return jsonify({"resident": update_resident(resident_id, payload())})


@personnel_api.delete("/residents/<resident_id>")
@json_endpoint
def residents_delete(resident_id):
    require_admin()
    return jsonify({"ok": True, "impact": delete_resident(resident_id)})


@personnel_api.put("/residents/<resident_id>/family-bindings")
@json_endpoint
def residents_family_bindings_update(resident_id):
    require_admin()
    return jsonify({"resident": update_family_binding(resident_id, payload())})


@personnel_api.put("/residents/<resident_id>/staff-assignments")
@json_endpoint
def residents_staff_assignments_update(resident_id):
    require_admin()
    return jsonify({"resident": update_staff_assignments(resident_id, payload())})


@personnel_api.patch("/residents/<resident_id>/permissions")
@json_endpoint
def residents_permissions_update(resident_id):
    require_admin()
    return jsonify({"resident": update_permissions(resident_id, payload())})


@personnel_api.get("/accounts")
@json_endpoint
def accounts_index():
    require_admin()
    return jsonify({"users": list_account_records()})


@personnel_api.post("/accounts")
@json_endpoint
def accounts_create():
    require_admin()
    return jsonify({"user": create_account(payload())}), 201


@personnel_api.get("/accounts/<account_id>")
@json_endpoint
def accounts_show(account_id):
    require_admin()
    return jsonify({"user": get_account(account_id)})


@personnel_api.put("/accounts/<account_id>")
@json_endpoint
def accounts_update(account_id):
    require_admin()
    return jsonify({"user": update_account(account_id, payload())})


@personnel_api.delete("/accounts/<account_id>")
@json_endpoint
def accounts_delete(account_id):
    require_admin()
    delete_account(account_id)
    return jsonify({"ok": True})


@personnel_api.patch("/accounts/<account_id>/status")
@json_endpoint
def accounts_status_update(account_id):
    require_admin()
    return jsonify({"user": update_account_status(account_id, payload())})


@personnel_api.post("/accounts/<account_id>/assignments")
@json_endpoint
def accounts_assignment_create(account_id):
    require_admin()
    return jsonify({"user": assign_account_to_resident(account_id, payload())}), 201


@personnel_api.delete("/accounts/<account_id>/assignments/<assignment_id>")
@json_endpoint
def accounts_assignment_delete(account_id, assignment_id):
    require_admin()
    return jsonify({"user": delete_account_assignment(account_id, assignment_id)})


@personnel_api.post("/accounts/<account_id>/family-bindings")
@json_endpoint
def accounts_family_binding_create(account_id):
    require_admin()
    return jsonify({"user": bind_family_account_to_resident(account_id, payload())}), 201


@personnel_api.delete("/accounts/<account_id>/family-bindings/<binding_id>")
@json_endpoint
def accounts_family_binding_delete(account_id, binding_id):
    require_admin()
    return jsonify({"user": delete_family_binding(account_id, binding_id)})


@personnel_api.post("/me/family-accounts")
@json_endpoint
def self_family_account_create():
    account = require_elderly_account()
    return jsonify(create_self_family_account(account["accountId"], payload())), 201


@personnel_api.delete("/me/family-bindings/<binding_id>")
@json_endpoint
def self_family_account_delete(binding_id):
    account = require_elderly_account()
    return jsonify(delete_self_family_account(account["accountId"], binding_id))


@personnel_api.post("/me/friends")
@json_endpoint
def self_friend_create():
    account = require_elderly_account()
    return jsonify(create_self_friend(account["accountId"], payload())), 201


@personnel_api.delete("/me/friends/<friendship_id>")
@json_endpoint
def self_friend_delete(friendship_id):
    account = require_elderly_account()
    return jsonify(delete_self_friend(account["accountId"], friendship_id))
