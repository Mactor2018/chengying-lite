(function () {
    "use strict";

    var palette = ["#3370ff", "#15b8a6", "#f5a623", "#7b68ee", "#f45b5b", "#2fb875"];
    var runningAnimations = typeof WeakMap === "function" ? new WeakMap() : null;
    var pendingCharts = typeof WeakMap === "function" ? new WeakMap() : null;

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

    function drawBar(canvas, input, progress) {
        progress = typeof progress === "number" ? progress : 1;
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
            var displayValue = Math.round(value * progress);
            var barHeight = Math.round((height - bottom - top - 12) * value / max * progress);
            var x = left + index * (barWidth + gap) + 8;
            var y = height - bottom - barHeight;
            ctx.fillStyle = palette[index % palette.length];
            roundRect(ctx, x, y, barWidth, barHeight, 6);
            ctx.fill();
            ctx.fillStyle = "#1f2633";
            ctx.textAlign = "center";
            ctx.font = "700 12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            ctx.fillText(String(displayValue), x + barWidth / 2, y - 6);
            ctx.fillStyle = "#70798a";
            ctx.font = "11px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            ctx.fillText(shortLabel(data.labels[index]), x + barWidth / 2, height - 12);
        });
    }

    function drawDonut(canvas, input, progress) {
        progress = typeof progress === "number" ? progress : 1;
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
        var visibleTotal = total * progress;
        var consumed = 0;
        data.values.forEach(function (value, index) {
            var fullSlice = Math.PI * 2 * value / total;
            var visibleValue = Math.max(0, Math.min(value, visibleTotal - consumed));
            if (visibleValue > 0) {
                var slice = Math.PI * 2 * visibleValue / total;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, start, start + slice);
                ctx.closePath();
                ctx.fillStyle = palette[index % palette.length];
                ctx.fill();
            }
            start += fullSlice;
            consumed += value;
        });
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.58, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.fillStyle = "#1f2633";
        ctx.textAlign = "center";
        ctx.font = "800 22px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
        ctx.fillText(String(Math.round(total * progress)), cx, cy + 7);

        var legendX = Math.min(width * 0.58, cx + radius + 34);
        var valueX = width - 18;
        var labelX = legendX + 18;
        data.labels.forEach(function (label, index) {
            var y = 34 + index * 28;
            ctx.fillStyle = palette[index % palette.length];
            roundRect(ctx, legendX, y - 10, 12, 12, 3);
            ctx.fill();
            ctx.fillStyle = "#1f2633";
            ctx.textAlign = "left";
            ctx.font = "700 12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            var displayValue = String(Math.round(data.values[index] * progress));
            var badgeWidth = Math.max(24, ctx.measureText(displayValue).width + 14);
            var labelWidth = Math.max(10, valueX - badgeWidth - labelX - 10);
            ctx.fillText(fitLabel(ctx, label, labelWidth), labelX, y);
            ctx.textAlign = "center";
            ctx.fillStyle = "#eef4ff";
            roundRect(ctx, valueX - badgeWidth, y - 14, badgeWidth, 20, 8);
            ctx.fill();
            ctx.fillStyle = "#4668cd";
            ctx.font = "800 12px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            ctx.fillText(displayValue, valueX - badgeWidth / 2, y + 1);
        });
    }

    function drawProgress(canvas, input, progress) {
        progress = typeof progress === "number" ? progress : 1;
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
            roundRect(ctx, 104, y - 8, Math.max(2, trackWidth * value / max * progress), 14, 7);
            ctx.fill();
            ctx.fillStyle = "#1f2633";
            ctx.textAlign = "right";
            ctx.fillText(String(Math.round(value * progress)), width - 12, y + 6);
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

    function fitLabel(ctx, label, maxWidth) {
        var text = String(label || "");
        if (ctx.measureText(text).width <= maxWidth) {
            return text;
        }
        var suffix = ".";
        var result = text;
        while (result.length > 1 && ctx.measureText(result + suffix).width > maxWidth) {
            result = result.slice(0, -1);
        }
        return result + suffix;
    }

    function easeOutCubic(value) {
        return 1 - Math.pow(1 - value, 3);
    }

    function animateChart(canvas, input, drawer) {
        canvas.dataset.chartAnimated = "true";
        var token = {};
        var startedAt = 0;
        var duration = 900;
        if (runningAnimations) {
            runningAnimations.set(canvas, token);
        }

        function tick(timestamp) {
            if (runningAnimations && runningAnimations.get(canvas) !== token) {
                return;
            }
            if (!startedAt) {
                startedAt = timestamp;
            }
            var elapsed = timestamp - startedAt;
            var progress = easeOutCubic(Math.min(1, elapsed / duration));
            drawer(canvas, input, progress);
            if (progress < 1) {
                window.requestAnimationFrame(tick);
            } else if (runningAnimations) {
                runningAnimations.delete(canvas);
            }
        }

        window.requestAnimationFrame(tick);
    }

    function renderChart(canvas, input, drawer) {
        if (!canvas) {
            return;
        }
        if (!window.requestAnimationFrame || !canvas.dataset) {
            drawer(canvas, input, 1);
            return;
        }
        if (canvas.dataset.chartAnimated === "true") {
            if (runningAnimations && runningAnimations.has(canvas)) {
                return;
            }
            drawer(canvas, input, 1);
            return;
        }

        if ("IntersectionObserver" in window) {
            if (pendingCharts) {
                pendingCharts.set(canvas, { input: input, drawer: drawer });
            }
            drawer(canvas, input, 0);
            if (canvas.dataset.chartObserverAttached !== "true") {
                canvas.dataset.chartObserverAttached = "true";
                var observer = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) {
                            return;
                        }
                        observer.disconnect();
                        canvas.dataset.chartObserverAttached = "";
                        var pending = pendingCharts ? pendingCharts.get(canvas) : null;
                        animateChart(canvas, pending ? pending.input : input, pending ? pending.drawer : drawer);
                        if (pendingCharts) {
                            pendingCharts.delete(canvas);
                        }
                    });
                }, { threshold: 0.35 });
                observer.observe(canvas);
            }
            return;
        }

        animateChart(canvas, input, drawer);
    }

    function render(payload) {
        payload = payload || {};
        renderChart(document.getElementById("chartResidentsByCare"), payload.residentsByCare, drawDonut);
        renderChart(document.getElementById("chartUsersByRole"), payload.usersByRole, drawBar);
        renderChart(document.getElementById("chartAccountStatus"), payload.accountStatus, drawDonut);
        renderChart(document.getElementById("chartStaffAssignmentResponsibilities"), payload.staffAssignmentResponsibilities, drawBar);
        renderChart(document.getElementById("chartResidentCareTeamCoverage"), payload.residentCareTeamCoverage, drawProgress);
        renderChart(document.getElementById("chartFamilyPermissionCoverage"), payload.familyPermissionCoverage, drawProgress);
        renderChart(document.getElementById("chartAccountsByDepartment"), payload.accountsByDepartment, drawBar);
        renderChart(document.getElementById("chartResidentCoreStaffing"), payload.residentCoreStaffing, drawDonut);
        renderChart(document.getElementById("chartInquiryStatus"), payload.inquiriesByStatus, drawDonut);
        renderChart(document.getElementById("chartConversationResidents"), payload.conversationsByResident, drawBar);
        renderChart(document.getElementById("chartConversationMessages"), payload.messagesByConversation, drawBar);
        renderChart(document.getElementById("chartScheduleTypes"), payload.schedulesByType, drawDonut);
        renderChart(document.getElementById("chartAppointmentStatus"), payload.appointmentsByStatus, drawDonut);
        renderChart(document.getElementById("chartTaskCompletion"), payload.taskCompletion, drawProgress);
        renderChart(document.getElementById("chartMealStatus"), payload.mealStatus, drawDonut);
        renderChart(document.getElementById("chartSleepStatus"), payload.sleepStatus, drawDonut);
        renderChart(document.getElementById("chartMoodStatus"), payload.moodStatus, drawBar);
        renderChart(document.getElementById("chartActivityStatus"), payload.activityStatus, drawProgress);
        renderChart(document.getElementById("chartCareCompletion"), payload.careCompletion, drawProgress);
        renderChart(document.getElementById("chartResidentCareSignals"), payload.residentCareSignals, drawDonut);
        renderChart(document.getElementById("chartResidentScheduleTypes"), payload.residentScheduleTypes, drawDonut);
        renderChart(document.getElementById("chartResidentCommunication"), payload.residentCommunication, drawBar);
        renderChart(document.getElementById("chartResidentVitals"), payload.residentVitals, drawProgress);
    }

    window.CareBridgeCharts = {
        render: render
    };
})();
