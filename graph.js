function renderLineChart(args) {
    const {
        element,
        points,
        lineWidth = 2,
        padding = 8,
        showGrid = false,
        showPoints = false,
        showAxisLabels = false,
        showXAxisDates = false,
        showHoverValues = false,
        startAtZero = false,
        gridOpacity = 0.1
    } = args;

    if (!element) {
        throw new Error("renderLineChart: element is required");
    }

    if (!Array.isArray(points)) {
        throw new Error("renderLineChart: points must be an array");
    }

    element.innerHTML = "";
    if (showAxisLabels) {
        element.style.position = "relative";
        const labels = document.createElement("div");
        labels.className = "tradez-chart-axis-labels";
        labels.style.cssText = "position:absolute;inset:0 auto 0 0;width:48px;display:flex;flex-direction:column;justify-content:space-between;padding:4px 0;box-sizing:border-box;color:#606875;font:11px Arial,sans-serif;pointer-events:none;z-index:1";
        element.append(labels);
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    element.appendChild(canvas);

    const sortedPoints = points
        .filter(point =>
            Array.isArray(point) &&
            point.length >= 2 &&
            Number.isFinite(Number(point[0])) &&
            Number.isFinite(Number(point[1]))
        )
        .map(point => [
            Number(point[0]),
            Number(point[1])
        ])
        .sort((a, b) => a[0] - b[0]);
    let hoveredPoint = null;

    function resize() {
        const rect = element.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const width = rect.width;
        const height = rect.height;

        canvas.style.width = "100%";
        canvas.style.height = "100%";

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        draw(width, height);
    }

    function draw(width, height) {
        ctx.clearRect(0, 0, width, height);

        if (sortedPoints.length === 0) {
            return;
        }

        const timestamps = sortedPoints.map(point => point[0]);
        const values = sortedPoints.map(point => point[1]);

        const minX = Math.min(...timestamps);
        const maxX = Math.max(...timestamps);

        let minY = 0;
        let maxY = Math.max(...values, 1);
        if (!startAtZero) {
            minY = Math.min(...values);
            maxY = Math.max(...values);
            const valuePadding = (maxY - minY || Math.abs(minY) || 10) * 0.1;
            minY -= valuePadding;
            maxY += valuePadding;
        }

        const leftPadding = padding;
        const chartWidth = Math.max(0, width - leftPadding - padding);
        const bottomPadding = showXAxisDates ? 20 : padding;
        const chartHeight = Math.max(0, height - padding - bottomPadding);
        if (showAxisLabels) {
            const labels = element.querySelector(".tradez-chart-axis-labels");
            labels.style.width = `${Math.max(48, leftPadding + 8)}px`;
            labels.style.left = "0";
            labels.style.paddingLeft = "4px";
            const formatLabel = value => Math.round(value).toLocaleString();
            labels.innerHTML = `<span>${formatLabel(maxY)}</span><span>${formatLabel((minY + maxY) / 2)}</span><span>${formatLabel(minY)}</span>`;
        }

        function getX(timestamp) {
            if (maxX === minX) {
                return width / 2;
            }

            return (
                leftPadding +
                ((timestamp - minX) / (maxX - minX)) *
                    chartWidth
            );
        }

        function getY(value) {
            return (
                padding +
                chartHeight -
                ((value - minY) / (maxY - minY)) *
                    chartHeight
            );
        }

        if (showXAxisDates) {
            ctx.fillStyle = "#606875";
            ctx.font = "10px Arial, sans-serif";
            ctx.textBaseline = "bottom";
            const dateFor = timestamp => new Date(Math.abs(timestamp) < 1e12 ? timestamp * 1000 : timestamp).toLocaleDateString();
            ctx.textAlign = "left";
            ctx.fillText(dateFor(minX), leftPadding, height - 3);
            ctx.textAlign = "center";
            ctx.fillText(dateFor((minX + maxX) / 2), width / 2, height - 3);
            ctx.textAlign = "right";
            ctx.fillText(dateFor(maxX), width - padding, height - 3);
        }

        if (showGrid) {
            ctx.strokeStyle = `rgba(0, 0, 0, ${gridOpacity})`;
            ctx.lineWidth = 1;

            const lines = 4;

            for (let i = 0; i <= lines; i++) {
                const y =
                    padding +
                    (chartHeight / lines) * i;

                ctx.beginPath();
                ctx.moveTo(leftPadding, y);
                ctx.lineTo(width - padding, y);
                ctx.stroke();
            }
        }

        if (sortedPoints.length === 1) {
            const x = getX(sortedPoints[0][0]);
            const y = getY(sortedPoints[0][1]);

            ctx.fillStyle = "lime";

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();

            return;
        }

        ctx.strokeStyle = "lime";
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();

        sortedPoints.forEach(([timestamp, value], index) => {
            const x = getX(timestamp);
            const y = getY(value);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        if (showPoints) {
            ctx.fillStyle = "lime";

            sortedPoints.forEach(([timestamp, value]) => {
                ctx.beginPath();
                ctx.arc(
                    getX(timestamp),
                    getY(value),
                    2.5,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            });
        }
        if (showHoverValues && hoveredPoint) {
            const x = getX(hoveredPoint[0]);
            ctx.strokeStyle = "rgba(50, 60, 72, 0.45)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    let readout;
    if (showHoverValues) {
        readout = document.createElement("div");
        readout.className = "tradez-chart-point-readout";
        readout.style.cssText = "display:none;position:absolute;padding:5px 8px;border-radius:5px;background:rgba(255,255,255,.96);color:#20242b;font:600 12px Arial,sans-serif;pointer-events:none;z-index:2;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.15)";
        element.append(readout);
        canvas.addEventListener("pointermove", event => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const timestamps = sortedPoints.map(point => point[0]);
            const minX = Math.min(...timestamps);
            const maxX = Math.max(...timestamps);
            const chartWidth = Math.max(0, rect.width - padding * 2);
            const pointX = point => maxX === minX ? rect.width / 2 : padding + ((point[0] - minX) / (maxX - minX)) * chartWidth;
            hoveredPoint = sortedPoints.reduce((best, point) => Math.abs(pointX(point) - x) < Math.abs(pointX(best) - x) ? point : best, sortedPoints[0]);
            readout.textContent = hoveredPoint[1].toLocaleString();
            readout.style.display = "block";
            const bounds = element.getBoundingClientRect();
            readout.style.left = `${Math.min(element.clientWidth - readout.offsetWidth - 4, Math.max(4, event.clientX - bounds.left + 12))}px`;
            readout.style.top = `${Math.min(element.clientHeight - readout.offsetHeight - 4, Math.max(4, event.clientY - bounds.top + 12))}px`;
            resize();
        });
        canvas.addEventListener("pointerleave", () => {
            hoveredPoint = null;
            readout.style.display = "none";
            resize();
        });
    }

    const observer = new ResizeObserver(resize);

    observer.observe(element);

    resize();

    return {
        redraw: resize,

        destroy() {
            observer.disconnect();
            canvas.remove();
        }
    };
}
