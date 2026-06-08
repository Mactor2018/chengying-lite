from flask import Flask, render_template


def create_app():
    app = Flask(
        __name__,
        static_folder="../assets",
        static_url_path="/assets",
        template_folder="templates",
    )

    modules = [
        {
            "name": "Personnel & Resident Profiles",
            "pages": "Dashboard, Residents, User Management",
            "operations": "Add, modify, delete, search, role and care-level charts",
        },
        {
            "name": "Conversations & Service Inquiries",
            "pages": "Conversations, Inquiry Detail, Resident Quick Profile",
            "operations": "Add, modify, archive/delete, search, inquiry-status charts",
        },
        {
            "name": "Schedule & Appointments",
            "pages": "Schedule, Create Schedule, Appointment Requests",
            "operations": "Add, modify, cancel/delete, search, schedule and approval charts",
        },
        {
            "name": "Care Records & Daily Reports",
            "pages": "Care Records, Health Observation, Daily Reports, Trend Dashboard",
            "operations": "Add, modify, delete, search, care-status charts",
        },
    ]

    @app.get("/")
    def index():
        return render_template("index.html", modules=modules)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
