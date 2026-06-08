(function () {
    "use strict";

    var palette = ["#3370ff", "#15b8a6", "#f5a623", "#7b68ee", "#f45b5b", "#2fb875"];

    function normalize(data) {
        if (!data) {
            return { labels: [], values: [] };
        }
        if (Array.isArray(data.labels) && Array.isArray(data.values)) {
            return data;
        }
        var labels = Object.keys(data);
        return {
            labels: labels,
            values: labels.map(function (label) {
                return Number(data[label] || 0);
            })
        };
    }

    function prepare(canvas) {
        if (!canvas || !canvas.getContext) {
            return null;
        }
        var rect = canvas.getBoundingClientRect();
        var width = Math.max(300, Math.floor(rect.width || canvas.clientWidth || 360));
        var height = Math.max(180, Math.floor(rect.height || 220));
        var ratio = window.devicePixelRatio || 1;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        var ctx = canvas.getContext("2d");
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
        return { ctx: ctx, width: width, height: height };
    }

    function drawEmpty(ctx, width, height) {
        ctx.fillStyle = "#98a1b3";
        ctx.textAlign = "center";
        ctx.fillText("No data yet", width / 2, height / 2);
    }

    function drawBar(canvas, input) {
        var chart = prepare(canvas);
        if (!chart) {
            return;
        }
        var ctx = chart.ctx;
        var width = chart.width;
        var height = chart.height;
        var data = normalize(input);
        var values = data.values;
        if (!values.length) {
            drawEmpty(ctx, width, height);
            return;
        }
        var max = Math.max.apply(null, values.concat([1]));
        var left = 26;
        var bottom = 34;
        var top = 18;
        var gap = 12;
        var usableWidth = width - left - 18;
        var barWidth = Math.max(24, (usableWidth - gap * (values.length - 1)) / values.length);

        ctx.strokeStyle = "#dce2ec";
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, height - bottom);
        ctx.lineTo(width - 10, height - bottom);
        ctx.stroke();

        values.forEach(function (value, index) {
            var barHeight = Math.round((height - bottom - top - 12) * value / max);
            var x = left + index * (barWidth + gap) + 8;
            var y = height - bottom - barHeight;
            ctx.fillStyle = palette[index % palette.length];
            roundRect(ctx, x, y, barWidth, barHeight, 6);
            ctx.fill();
            ctx.fillStyle = "#1f2633";
            ctx.textAlign = "center";
            ctx.font = "700 12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            ctx.fillText(String(value), x + barWidth / 2, y - 6);
            ctx.fillStyle = "#70798a";
            ctx.font = "11px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            ctx.fillText(shortLabel(data.labels[index]), x + barWidth / 2, height - 12);
        });
    }

    function drawDonut(canvas, input) {
        var chart = prepare(canvas);
        if (!chart) {
            return;
        }
        var ctx = chart.ctx;
        var width = chart.width;
        var height = chart.height;
        var data = normalize(input);
        var total = data.values.reduce(function (sum, value) {
            return sum + Number(value || 0);
        }, 0);
        if (!total) {
            drawEmpty(ctx, width, height);
            return;
        }
        var cx = Math.min(width * 0.35, 135);
        var cy = height / 2;
        var radius = Math.min(68, height * 0.34);
        var start = -Math.PI / 2;
        data.values.forEach(function (value, index) {
            var slice = Math.PI * 2 * value / total;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, start, start + slice);
            ctx.closePath();
            ctx.fillStyle = palette[index % palette.length];
            ctx.fill();
            start += slice;
        });
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.58, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.fillStyle = "#1f2633";
        ctx.textAlign = "center";
        ctx.font = "800 22px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
        ctx.fillText(String(total), cx, cy + 7);

        var legendX = Math.min(width * 0.58, cx + radius + 34);
        data.labels.forEach(function (label, index) {
            var y = 34 + index * 28;
            ctx.fillStyle = palette[index % palette.length];
            roundRect(ctx, legendX, y - 10, 12, 12, 3);
            ctx.fill();
            ctx.fillStyle = "#1f2633";
            ctx.textAlign = "left";
            ctx.font = "700 12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            ctx.fillText(shortLabel(label, 18), legendX + 18, y);
            ctx.fillStyle = "#70798a";
            ctx.fillText(String(data.values[index]), width - 26, y);
        });
    }

    function drawProgress(canvas, input) {
        var chart = prepare(canvas);
        if (!chart) {
            return;
        }
        var ctx = chart.ctx;
        var width = chart.width;
        var height = chart.height;
        var data = normalize(input);
        if (!data.values.length) {
            drawEmpty(ctx, width, height);
            return;
        }
        var max = Math.max.apply(null, data.values.concat([1]));
        data.values.forEach(function (value, index) {
            var y = 28 + index * 34;
            var trackWidth = width - 138;
            ctx.fillStyle = "#70798a";
            ctx.textAlign = "left";
            ctx.font = "700 12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            ctx.fillText(shortLabel(data.labels[index], 16), 12, y + 6);
            ctx.fillStyle = "#e8edf6";
            roundRect(ctx, 104, y - 8, trackWidth, 14, 7);
            ctx.fill();
            ctx.fillStyle = palette[index % palette.length];
            roundRect(ctx, 104, y - 8, Math.max(2, trackWidth * value / max), 14, 7);
            ctx.fill();
            ctx.fillStyle = "#1f2633";
            ctx.textAlign = "right";
            ctx.fillText(String(value), width - 12, y + 6);
        });
    }

    function roundRect(ctx, x, y, width, height, radius) {
        var r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
    }

    function shortLabel(label, limit) {
        var text = String(label || "");
        var max = limit || 11;
        return text.length > max ? text.slice(0, max - 1) + "." : text;
    }

    function render(payload) {
        payload = payload || {};
        drawDonut(document.getElementById("chartResidentsByCare"), payload.residentsByCare);
        drawBar(document.getElementById("chartUsersByRole"), payload.usersByRole);
        drawDonut(document.getElementById("chartAccountStatus"), payload.accountStatus);
        drawDonut(document.getElementById("chartInquiryStatus"), payload.inquiriesByStatus);
        drawBar(document.getElementById("chartConversationResidents"), payload.conversationsByResident);
        drawDonut(document.getElementById("chartScheduleTypes"), payload.schedulesByType);
        drawDonut(document.getElementById("chartAppointmentStatus"), payload.appointmentsByStatus);
        drawProgress(document.getElementById("chartTaskCompletion"), payload.taskCompletion);
        drawDonut(document.getElementById("chartMealStatus"), payload.mealStatus);
        drawDonut(document.getElementById("chartSleepStatus"), payload.sleepStatus);
        drawBar(document.getElementById("chartMoodStatus"), payload.moodStatus);
        drawProgress(document.getElementById("chartActivityStatus"), payload.activityStatus);
        drawProgress(document.getElementById("chartCareCompletion"), payload.careCompletion);
    }

    window.CareBridgeCharts = {
        render: render
    };
})();
