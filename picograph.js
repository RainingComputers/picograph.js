/*
    PicoGraph, graphing library for Javascript,

    Copyright Vishnu Shankar B,
    https://github.com/RainingComputers
*/

const colors = [
    "#e52b50", "#008000", "#0000ff", "#ff00ff",
    "#a52a2a", "#00008b", "#008b8b", "#a9a9a9",
    "#006400", "#bdb76b", "#8b008b", "#556b2f",
    "#ff8c00", "#9932cc", "#8b0000", "#e9967a",
    "#9400d3", "#ff00ff", "#ffd700", "#008000",
    "#4b0082", "#f0e68c", "#add8e6", "#e0ffff",
    "#90ee90", "#d3d3d3", "#ffb6c1", "#ffffe0",
    "#800000", "#000080", "#808000", "#ffa500",
    "#ffc0cb", "#800080", "#800080", "#ff0000",
    "#c0c0c0", "#ffffff", "#ffff00"
]

const byID = function (id) { return document.getElementById(id); };

/* Helper function for creating graphs */
function createGraph(canvasID, labels, unit, labelDivID, intervalSize, maxVal,
    vlines = false, timestamps = false, scalesteps = 5, vlinesFreq = 1) {
    /* Create valueIDs for each label */
    const valueIDs = []
    for (let i = 0; i < labels.length; i++) {
        valueIDs[i] = canvasID + labels[i].replace(" ", "") + "value";
    }

    /* Create graph  */
    const graph = new Graph(canvasID, labels.length, valueIDs, unit, intervalSize, maxVal,
        vlines, timestamps, scalesteps, vlinesFreq);

    /* Set label colors */
    for (let i = 0; i < labels.length; i++) {
        const colorID = valueIDs[i] + "color";

        byID(labelDivID).innerHTML += `
            <div style="display: inline-block;">
                <svg width="10" height="10">
                    <rect id="${colorID}" width="10" height="10"/>
                </svg> 
                <span>${labels[i]}:</span>
                <span id="${valueIDs[i]}"></span>
            <div>
        `

        const labelcolor = graph.colors[i];
        byID(colorID).style = "fill:" + labelcolor;
    }

    return graph;
}

/* Graph class, plots and updates graphs */
class Graph {
    constructor(canvasID, noLabels, valueIDs, unit, intervalSize, maxVal, vlines, timestamps, scalesteps, vlinesFreq) {
        /* Get the drawing context */
        this.canvas = byID(canvasID);
        const ctx = this.canvas.getContext("2d");
        this.ctx = ctx;

        /* Set proper height and width */
        this.setWidthHeight()

        /* Initialize class constiables */
        this.cssScale = window.devicePixelRatio;
        this.scalesteps = scalesteps
        this.noLabels = noLabels;
        this.intervalSize = intervalSize * this.cssScale;
        this.nValuesFloat = this.width / this.intervalSize
        this.nValues = Math.round(this.nValuesFloat) + 1;
        this.points = emptyArray(noLabels, this.nValues);
        this.timestamps_array = emptyArray(1, this.nValues, "");
        this.colors = colorArray(noLabels);
        this.maxVal = maxVal;
        this.valueIDs = valueIDs;
        this.unit = unit;
        this.vlines = vlines;
        this.timestamps = timestamps;
        this.vlinesFreq = vlinesFreq;
    }

    setWidthHeight() {
        this.cssScale = window.devicePixelRatio;

        /* Set canvas height and width */
        this.canvas.width = this.canvas.clientWidth * this.cssScale;
        this.canvas.height = this.canvas.clientHeight * this.cssScale;
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
    }

    update(values) {
        for (let i = 0; i < this.noLabels; i++) {
            /* Update scale */
            if (values[i] > this.maxVal) {
                this.maxVal = values[i];
            }

            /* Shift new point into points array */
            this.points = shiftArrayRowLeft(this.points, i, this.nValues, values[i]);

            /* Update value */
            byID(this.valueIDs[i]).innerHTML = values[i].toFixed(2) + ' ' + this.unit;
        }

        /* Log time and add to timestamps_array array */
        const d = new Date();
        const timestamp_str = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        this.timestamps_array = shiftArrayRowLeft(this.timestamps_array, 0, this.nValues, timestamp_str);

        /* Clear canvas */
        this.ctx.clearRect(0, 0, this.width, this.height);

        /* Set proper height and width */
        this.setWidthHeight()

        /* update interval size */
        this.intervalSize = this.width / this.nValuesFloat;

        /* Set line width */
        this.ctx.lineWidth = 2 * this.cssScale;

        /* Draw vertical scale */
        if (this.vlines) {
            for (let i = this.nValues - 1; i >= 0; i -= this.vlinesFreq) {
                /* Calculate line coordinates */
                const x = (i + 1) * this.intervalSize;

                /* Draw line */
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.height);
                this.ctx.strokeStyle = "#e3e3e3";
                this.ctx.stroke();
            }
        }

        /* Calculate font size and space between scale lines */
        const hstep = this.height / this.scalesteps;
        const sstep = this.maxVal / this.scalesteps;

        const canvas_font = Math.min(0.5 * hstep, 15 * this.cssScale)
        this.ctx.font = canvas_font + "px monospace";


        /* Draw horizontal scale */
        for (let i = 1; i <= this.scalesteps; i++) {
            const y = this.height - i * hstep
            const xoffset = 2;
            const yoffset = canvas_font + 2 * this.cssScale;
            this.ctx.fillText((i * sstep).toFixed(2), xoffset, y + yoffset);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.strokeStyle = "#e3e3e3";
            this.ctx.stroke();
        }

        /* Draw time stamps */
        if (this.timestamps) {
            const xBoundPix = this.ctx.measureText((this.scalesteps * sstep).toFixed(2)).width;
            const xBound = Math.floor((xBoundPix / this.intervalSize) + 1)
            for (let i = this.nValues - 1; i >= xBound; i -= this.vlinesFreq) {
                /* Calculate line coordinates */
                const x = (i + 1) * this.intervalSize;


                /* Put time stamps */
                const xoffset = canvas_font + 2 * this.cssScale;
                const yoffset = this.ctx.measureText(this.timestamps_array[0][i]).width + 4 * this.cssScale;
                this.ctx.rotate(Math.PI / 2);
                this.ctx.fillText(this.timestamps_array[0][i], this.height - yoffset, -x + xoffset);
                this.ctx.stroke();
                this.ctx.rotate(-Math.PI / 2);
            }
        }

        /* Draw graph */
        for (let i = 0; i < this.noLabels; i++) {
            for (let j = this.nValues - 1; j > 0; j--) {
                /* Calculate line coordinates */
                const xstart = (j + 1) * this.intervalSize;
                const xend = j * this.intervalSize;
                const ystart = scaleInvert(this.points[i][j], this.maxVal, this.height);
                const yend = scaleInvert(this.points[i][j - 1], this.maxVal, this.height);

                /* Draw line */
                this.ctx.beginPath();
                this.ctx.moveTo(xstart, ystart);
                this.ctx.lineTo(xend, yend);
                this.ctx.strokeStyle = this.colors[i];
                this.ctx.stroke();
            }
        }

    }

}

/* Helper function to take a value value 
    and return y-coordinate for the canvas */
function scaleInvert(value, maxVal, height) {
    return (1 - value / maxVal) * height;
}

/* Helper function that shifts the contents of row to left */
function shiftArrayRowLeft(array, row, ncols, newVal) {
    for (let i = 0; i < ncols - 1; i++) {
        array[row][i] = array[row][i + 1];
    }

    array[row][ncols - 1] = newVal;

    return array;
}

/* Helper function to create an empty */
function emptyArray(nrows, ncols, fill = 0) {
    const arr = [];
    for (let i = 0; i < nrows; i++) {
        arr[i] = [];
        for (let j = 0; j < ncols; j++) {
            arr[i][j] = fill;
        }
    }
    return arr;
}

/* Helper function to create array of colors */
function colorArray(len) {
    const colorArray = [];
    for (let i = 0; i < len; i++) {
        colorArray[i] = colors[i % colors.length];
    }
    return colorArray;
}
