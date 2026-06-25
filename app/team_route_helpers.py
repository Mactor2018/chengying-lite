# -*- encoding: utf-8 -*-

from flask import redirect, render_template, url_for

from app.auth import current_account
from app.db import DatabaseUnavailable
from app.views import PAGES_BY_KEY, can_access_page, page_url


def page_or_redirect(page_key):
    page = PAGES_BY_KEY[page_key]
    account = current_account()
    if not can_access_page(page, account):
        if account is None:
            return None, redirect(url_for("auth.login_form"))
        return None, redirect(page_url("personnel"), code=302)
    return page, None


def database_error_page(page_key, error):
    page = PAGES_BY_KEY[page_key]
    return render_template(
        "pages/database-error.html",
        page=page,
        error=str(error),
    ), 500


def handle_database_error(page_key, error):
    if isinstance(error, DatabaseUnavailable):
        return database_error_page(page_key, error)
    return None
