function renderLineChart(args) {
    const {
        element,
        points,
        lineWidth = 2,
        padding = 8,
        showGrid = false,
        showPoints = false
    } = args;

    if (!element) {
        throw new Error("renderLineChart: element is required");
    }

    if (!Array.isArray(points)) {
        throw new Error("renderLineChart: points must be an array");
    }

    element.innerHTML = "";

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

        let minY = Math.min(...values);
        let maxY = Math.max(...values);

        if (minY === maxY) {
            const paddingY = Math.abs(minY) * 0.1 || 1;

            minY -= paddingY;
            maxY += paddingY;
        } else {
            const range = maxY - minY;
            const paddingY = range * 0.1;

            minY -= paddingY;
            maxY += paddingY;
        }

        const chartWidth = Math.max(0, width - padding * 2);
        const chartHeight = Math.max(0, height - padding * 2);

        function getX(timestamp) {
            if (maxX === minX) {
                return width / 2;
            }

            return (
                padding +
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

        if (showGrid) {
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.lineWidth = 1;

            const lines = 4;

            for (let i = 0; i <= lines; i++) {
                const y =
                    padding +
                    (chartHeight / lines) * i;

                ctx.beginPath();
                ctx.moveTo(padding, y);
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