# -*- encoding: utf-8 -*-

import json
import os
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class AIInsightError(Exception):
    pass


def generate_personnel_ai_insights(personnel_data):
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        raise AIInsightError("DeepSeek API key is not configured")

    model = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash").strip() or "deepseek-v4-flash"
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an operations analyst for a nursing home personnel management system. "
                    "Generate concise, practical staffing and access-control insights. "
                    "Your entire response must be one valid JSON object, with no markdown fences and no prose outside JSON. "
                    "Use keys: summary, riskLevel, highlights, risks, recommendations. "
                    "The summary value must be plain text, not another JSON object or encoded JSON string. "
                    "Use English. Keep each list item under 18 words."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(build_ai_context(personnel_data), ensure_ascii=False),
            },
        ],
        "response_format": {"type": "json_object"},
        "max_tokens": 700,
        "temperature": 0.2,
    }
    request = Request(
        "https://api.deepseek.com/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise AIInsightError(f"DeepSeek API returned {error.code}: {detail[:240]}") from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise AIInsightError(f"DeepSeek API request failed: {error}") from error

    content = (
        result.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )
    insights = parse_insight_content(content)

    return normalize_insights(insights, model)


def build_ai_context(personnel_data):
    residents = personnel_data.get("residents") or []
    users = personnel_data.get("users") or []
    return {
        "module": "Personnel & Resident Profile Management",
        "currentUserRole": (personnel_data.get("currentUser") or {}).get("role", ""),
        "recordCounts": {
            "residents": len(residents),
            "accounts": len(users),
            "activeStaff": len([
                user for user in users
                if user.get("status") == "Active" and user.get("role") not in ("Family Member", "Elderly Resident")
            ]),
            "frozenAccounts": len([user for user in users if user.get("status") == "Frozen"]),
            "familyBindings": sum(len(resident.get("familyBindings") or []) for resident in residents),
            "staffAssignments": sum(staff_assignment_count(resident) for resident in residents),
        },
        "roles": count_by(users, lambda user: user.get("role") or "Unknown"),
        "accountStatus": count_by(users, lambda user: user.get("status") or "Unknown"),
        "careLevels": count_by(residents, lambda resident: resident.get("careLevel") or "Unknown"),
        "residentCoverage": [resident_coverage(resident) for resident in residents],
        "permissionCoverage": permission_coverage(residents),
    }


def staff_assignment_count(resident):
    return (
        len(resident.get("caregivers") or [])
        + len(resident.get("doctors") or [])
        + len(resident.get("activityStaffMembers") or [])
        + (1 if resident.get("nurse") else 0)
        + (1 if resident.get("supervisor") else 0)
    )


def resident_coverage(resident):
    return {
        "resident": resident.get("name"),
        "careLevel": resident.get("careLevel"),
        "hasNurse": bool(resident.get("nurse")),
        "hasSupervisor": bool(resident.get("supervisor")),
        "doctorCount": len(resident.get("doctors") or []),
        "caregiverCount": len(resident.get("caregivers") or []),
        "activityStaffCount": len(resident.get("activityStaffMembers") or []),
        "familyBindingCount": len(resident.get("familyBindings") or []),
        "completeCoreTeam": bool(
            resident.get("nurse")
            and resident.get("supervisor")
            and len(resident.get("doctors") or []) > 0
            and len(resident.get("caregivers") or []) > 0
        ),
    }


def permission_coverage(residents):
    totals = {
        "dailyReports": 0,
        "appointments": 0,
        "staffSchedules": 0,
        "healthAttachments": 0,
    }
    for resident in residents:
        for binding in resident.get("familyBindings") or []:
            permissions = binding.get("permissions") or {}
            for key in totals:
                totals[key] += 1 if permissions.get(key) else 0
    return totals


def count_by(items, getter):
    result = {}
    for item in items:
        key = getter(item)
        result[key] = result.get(key, 0) + 1
    return result


def normalize_insights(insights, model):
    insights = coerce_insight_object(insights)
    return {
        "source": "deepseek",
        "model": model,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": clean_text(insights.get("summary") or "AI insight generated."),
        "riskLevel": normalize_risk(insights.get("riskLevel")),
        "highlights": normalize_list(insights.get("highlights")),
        "risks": normalize_list(insights.get("risks")),
        "recommendations": normalize_list(insights.get("recommendations")),
    }


def parse_insight_content(content):
    text = str(content or "").strip()
    if not text:
        return {"summary": "DeepSeek returned an empty insight response."}
    parsed = parse_jsonish(text)
    if parsed is not None:
        return coerce_insight_object(parsed)

    start = text.find("{")
    end = text.rfind("}")
    if start > -1 and end > start:
        parsed = parse_jsonish(text[start:end + 1])
        if parsed is not None:
            return coerce_insight_object(parsed)

    return {
        "summary": text[:600],
        "riskLevel": "Low",
        "highlights": [],
        "risks": [],
        "recommendations": [],
    }


def coerce_insight_object(value):
    if isinstance(value, str):
        parsed = parse_jsonish(value)
        if parsed is not None:
            return coerce_insight_object(parsed)
        return {"summary": value}
    if not isinstance(value, dict):
        return {"summary": str(value or "AI insight generated.")}

    result = dict(value)
    nested = parse_nested_insight(result.get("summary"))
    if nested:
        for key in ("summary", "riskLevel", "highlights", "risks", "recommendations"):
            if key in nested:
                result[key] = nested[key]

    if "recommendation" in result and "recommendations" not in result:
        result["recommendations"] = result["recommendation"]
    if "risk" in result and "risks" not in result:
        result["risks"] = result["risk"]
    if "keyFindings" in result and "highlights" not in result:
        result["highlights"] = result["keyFindings"]

    return result


def parse_nested_insight(value):
    if isinstance(value, dict):
        return value if has_insight_keys(value) else None
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text.startswith("{"):
        return None
    parsed = parse_jsonish(text)
    if isinstance(parsed, dict) and has_insight_keys(parsed):
        return parsed
    return None


def has_insight_keys(value):
    return any(key in value for key in ("summary", "riskLevel", "highlights", "risks", "recommendations"))


def parse_jsonish(text):
    text = str(text or "").strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def clean_text(value):
    return " ".join(str(value or "").split())


def normalize_risk(value):
    text = str(value or "Low").strip().title()
    return text if text in ("Low", "Medium", "High") else "Low"


def normalize_list(value):
    if isinstance(value, str):
        parsed = parse_jsonish(value)
        if isinstance(parsed, list):
            value = parsed
        else:
            value = [
                item.strip(" -•\t")
                for item in value.replace(";", "\n").splitlines()
                if item.strip(" -•\t")
            ]
    if not isinstance(value, list):
        return []
    return [clean_text(item) for item in value if clean_text(item)][:5]
