# -*- encoding: utf-8 -*-

import os
import smtplib
from email.message import EmailMessage
from html import escape


class EmailDeliveryError(Exception):
    pass


def send_password_reset_code(to_email, account_name, code):
    smtp_user = os.getenv("CAREBRIDGE_SMTP_USER", "").strip()
    smtp_password = os.getenv("CAREBRIDGE_SMTP_PASSWORD", "").strip()
    smtp_host = os.getenv("CAREBRIDGE_SMTP_HOST", "smtp.163.com").strip()
    smtp_port = int(os.getenv("CAREBRIDGE_SMTP_PORT", "465"))
    from_email = os.getenv("CAREBRIDGE_SMTP_FROM", smtp_user).strip() or smtp_user

    if not smtp_user or not smtp_password:
        raise EmailDeliveryError("SMTP account is not configured")
    if not to_email:
        raise EmailDeliveryError("Recovery email is required")

    message = EmailMessage()
    message["Subject"] = "CareBridge password recovery code"
    message["From"] = from_email
    message["To"] = to_email
    message.set_content(
        "\n".join([
            "CareBridge password recovery",
            "",
            f"Account: {account_name}",
            f"Verification code: {code}",
            "",
            "If you did not request this reset, ignore this email.",
        ])
    )
    message.add_alternative(render_password_reset_email(account_name, code), subtype="html")

    try:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as smtp:
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        raise EmailDeliveryError(f"Could not send recovery email: {error}") from error


def render_password_reset_email(account_name, code):
    safe_account = escape(str(account_name or "CareBridge user"))
    safe_code = escape(str(code or ""))
    code_cells = "".join(
        f'<span style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:52px;margin:0 4px;border-radius:12px;background:#ffffff;border:1px solid #c7d8ff;color:#1f2937;font-size:26px;font-weight:800;letter-spacing:0;box-shadow:0 8px 20px rgba(51,112,255,0.10);">{digit}</span>'
        for digit in safe_code
    )
    return f"""<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#eef4f3;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f3;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dbe4f0;border-radius:18px;overflow:hidden;box-shadow:0 20px 48px rgba(31,41,55,0.10);">
          <tr>
            <td style="padding:0;background:#f1f7ff;border-bottom:1px solid #dbeafe;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:26px 30px;">
                    <div style="display:inline-block;width:54px;height:54px;line-height:54px;text-align:center;border-radius:16px;background:#3370ff;color:#ffffff;font-size:22px;font-weight:800;box-shadow:0 10px 24px rgba(51,112,255,0.22);">CB</div>
                    <div style="margin-top:18px;color:#1d4ed8;font-size:13px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">CareBridge Account Recovery</div>
                    <div style="margin-top:8px;color:#1f2937;font-size:28px;font-weight:800;line-height:1.25;">Verify your password reset</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <p style="margin:0;color:#697386;font-size:16px;line-height:1.65;">Hi <strong style="color:#1f2937;">{safe_account}</strong>, use the verification code below to continue resetting your CareBridge password.</p>
              <div style="margin:26px 0 18px;padding:24px;border-radius:18px;background:#f6f9ff;border:1px solid #cfe0ff;text-align:center;">
                <div style="margin-bottom:14px;color:#7b8496;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Verification Code</div>
                <div style="font-size:0;white-space:nowrap;">{code_cells}</div>
              </div>
              <div style="padding:14px 16px;border-radius:14px;background:#ecfdf8;border:1px solid #b9f2df;color:#0f766e;font-size:14px;line-height:1.55;">
                If you did not request this reset, you can safely ignore this email. Your password will not change unless this code is verified.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 30px;background:#f8fbfa;border-top:1px solid #e3ebf5;color:#8a94a6;font-size:12px;line-height:1.5;">
              CareBridge MVP Demo · Automated recovery message
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
