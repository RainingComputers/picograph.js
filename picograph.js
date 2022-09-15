/*
    PicoGraph, graphing library for Javascript,

    Copyright Vishnu Shankar B,
    https://github.com/RainingComputers
*/

const colors = [
    "#e52b50",
    "#008000",
    "#0000ff",
    "#ff00ff",
    "#a52a2a",
    "#00008b",
    "#008b8b",
    "#a9a9a9",
    "#006400",
    "#bdb76b",
    "#8b008b",
    "#556b2f",
    "#ff8c00",
    "#9932cc",
    "#8b0000",
    "#e9967a",
    "#9400d3",
    "#ff00ff",
    "#ffd700",
    "#008000",
    "#4b0082",
    "#f0e68c",
    "#add8e6",
    "#e0ffff",
    "#90ee90",
    "#d3d3d3",
    "#ffb6c1",
    "#ffffe0",
    "#800000",
    "#000080",
    "#808000",
    "#ffa500",
    "#ffc0cb",
    "#800080",
    "#800080",
    "#ff0000",
    "#c0c0c0",
    "#ffffff",
    "#ffff00",
]

function byID(id) {
    return document.getElementById(id)
}

function createValueIDs(labels, canvasID) {
    const valueIDs = []

    for (let i = 0; i < labels.length; i++)
        valueIDs[i] = canvasID + labels[i].replace(" ", "") + "value"

    return valueIDs
}

function createLegendRect(labelDivID, color, label, valueID) {
    byID(labelDivID).innerHTML += `
        <div style="display: inline-block;">
            <svg width="10" height="10">
                <rect width="10" height="10" style="fill: ${color}"/>
            </svg> 
            <span>${label}:</span>
            <span id="${valueID}"></span>
        <div>
    `
}

function createGraph(
    canvasID,
    labels,
    unit,
    labelDivID,
    intervalSize,
    maxVal,
    minVal = 0,
    vlines = false,
    timestamps = false,
    scalesteps = 5,
    vlinesFreq = 1,
    autoScaleMode = 1
) {
    /* If autoscaling is disabled (or out of range) and min / max are not set, hard-set them to 0 and 100 respectively */
    if ([1, 2].includes(autoScaleMode) == false) {
        autoScaleMode = 0
        if (Number.isFinite(minVal) === false) {
            minVal = 0
        }
        if (Number.isFinite(maxVal) === false) {
            maxVal = 100
        }
    }

    const valueIDs = createValueIDs(labels, canvasID)

    const graph = new Graph(
        canvasID,
        labels.length,
        valueIDs,
        unit,
        intervalSize,
        maxVal,
        minVal,
        vlines,
        timestamps,
        scalesteps,
        vlinesFreq,
        autoScaleMode
    )

    for (let i = 0; i < labels.length; i++)
        createLegendRect(labelDivID, graph.colors[i], labels[i], valueIDs[i])

    return graph
}

/* Graph class, plots and updates graphs */
class Graph {
    constructor(
        canvasID,
        noLabels,
        valueIDs,
        unit,
        intervalSize,
        maxVal,
        minVal,
        vlines,
        timestamps,
        scalesteps,
        vlinesFreq,
        autoScaleMode
    ) {
        this.canvas = byID(canvasID)
        this.ctx = this.canvas.getContext("2d")
        this.setWidthHeight()

        this.cssScale = window.devicePixelRatio
        this.scalesteps = scalesteps
        this.noLabels = noLabels
        this.intervalSize = intervalSize * this.cssScale
        this.nValuesFloat = this.width / this.intervalSize
        this.nValues = Math.round(this.nValuesFloat) + 1
        this.points = emptyArray(noLabels, this.nValues)
        this.timestampsArray = emptyArray(1, this.nValues, "")
        this.colors = colorArray(noLabels)
        this.maxVal = maxVal
        this.valueIDs = valueIDs
        this.unit = unit
        this.vlines = vlines
        this.timestamps = timestamps
        this.vlinesFreq = vlinesFreq
        this.minVal = minVal
        this.autoScaleMode = autoScaleMode
    }

    setWidthHeight() {
        this.cssScale = window.devicePixelRatio
        this.canvas.width = this.canvas.clientWidth * this.cssScale
        this.canvas.height = this.canvas.clientHeight * this.cssScale
        this.width = this.ctx.canvas.width
        this.height = this.ctx.canvas.height
    }

    updateMinMax(values, i) {
        if (values[i] < this.minVal) this.minVal = values[i]

        if (values[i] > this.maxVal) this.maxVal = values[i]

        let valueMinMaxDelta = Math.abs(this.maxVal - this.minVal)

        let newMaxVal =
            Math.ceil(Math.max.apply(Math, this.points.flat().filter(Number.isFinite))) +
            valueMinMaxDelta * 0.05

        let newMinVal =
            Math.floor(Math.min.apply(Math, this.points.flat().filter(Number.isFinite))) -
            valueMinMaxDelta * 0.05

        if (this.autoScaleMode == 2) {
            this.maxVal = newMaxVal
            this.minVal = newMinVal
            return
        } else {
            /* autoScaleMode == 1 */
            if (values[i] > this.maxVal - valueMinMaxDelta * 0.05) {
                this.maxVal = newMaxVal
            }

            if (values[i] < this.minVal + valueMinMaxDelta * 0.05) {
                this.minVal = newMinVal
            }
        }
    }

    updateValues(values) {
        for (let i = 0; i < this.noLabels; i++) {
            /* Update scale */
            if (this.autoScaleMode > 0) this.updateMinMax(values, i)

            /* Shift new point into points array */
            this.points = shiftArrayRowLeft(this.points, i, this.nValues, values[i])

            /* Update value */
            byID(this.valueIDs[i]).innerHTML = values[i].toFixed(2) + " " + this.unit
        }
    }

    updateTimestamps() {
        const timestampString = getTimestamp()

        this.timestampsArray = shiftArrayRowLeft(
            this.timestampsArray,
            0,
            this.nValues,
            timestampString
        )
    }

    drawVerticalLines() {
        for (let i = this.nValues - 1; i >= 0; i -= this.vlinesFreq) {
            /* Calculate line coordinates */
            const x = (i + 1) * this.intervalSize

            /* Draw line */
            this.ctx.beginPath()
            this.ctx.moveTo(x, 0)
            this.ctx.lineTo(x, this.height)
            this.ctx.strokeStyle = "#e3e3e3"
            this.ctx.stroke()
        }
    }

    calculateStepAndFontPixels() {
        const hstep = this.height / this.scalesteps
        const sstep = (this.maxVal - this.minVal) / this.scalesteps

        const canvasFont = Math.min(0.5 * hstep, 15 * this.cssScale)
        return { canvasFont, hstep, sstep }
    }

    drawHorizontalLines(hstep, canvasFont, sstep) {
        let entityDecode = document.createElement("textarea")
        entityDecode.innerHTML = this.unit

        for (let i = 1; i <= this.scalesteps; i++) {
            const y = this.height - i * hstep
            const xoffset = 2
            const yoffset = canvasFont + 2 * this.cssScale
            this.ctx.fillText(
                (i * sstep + this.minVal).toFixed(2) + " " + entityDecode.value,
                xoffset,
                y + yoffset
            )
            this.ctx.beginPath()
            this.ctx.moveTo(0, y)
            this.ctx.lineTo(this.width, y)
            this.ctx.strokeStyle = "#e3e3e3"
            this.ctx.stroke()
        }
    }

    drawTimestamps(sstep, canvasFont) {
        const xBoundPix = this.ctx.measureText((this.scalesteps * sstep).toFixed(2)).width
        const xBound = Math.floor(xBoundPix / this.intervalSize + 1)

        for (let i = this.nValues - 1; i >= xBound; i -= this.vlinesFreq) {
            /* Calculate line coordinates */
            const x = (i + 1) * this.intervalSize

            /* Put time stamps */
            const xoffset = canvasFont + 2 * this.cssScale
            const yoffset =
                this.ctx.measureText(this.timestampsArray[0][i]).width + 4 * this.cssScale
            this.ctx.rotate(Math.PI / 2)
            this.ctx.fillText(this.timestampsArray[0][i], this.height - yoffset, -x + xoffset)
            this.ctx.stroke()
            this.ctx.rotate(-Math.PI / 2)
        }
    }

    drawGraph() {
        for (let i = 0; i < this.noLabels; i++) {
            for (let j = this.nValues - 1; j > 0; j--) {
                /* Calculate line coordinates */
                const xstart = j * this.intervalSize
                const xend = (j - 1) * this.intervalSize
                const ystart = scaleInvert(this.points[i][j], this.minVal, this.maxVal, this.height)
                const yend = scaleInvert(
                    this.points[i][j - 1],
                    this.minVal,
                    this.maxVal,
                    this.height
                )

                /* Draw line */
                this.ctx.beginPath()
                this.ctx.moveTo(xstart, ystart)
                this.ctx.lineTo(xend, yend)
                this.ctx.strokeStyle = this.colors[i]
                this.ctx.stroke()
            }
        }
    }

    update(values) {
        this.updateValues(values)

        /* Log time and add to timestampsArray array */
        this.updateTimestamps()

        /* Clear canvas */
        this.ctx.clearRect(0, 0, this.width, this.height)

        /* Set height and width */
        this.setWidthHeight()

        /* update interval size */
        this.intervalSize = this.width / this.nValuesFloat

        /* Set line width */
        this.ctx.lineWidth = 2 * this.cssScale

        /* Draw vertical scale */
        if (this.vlines) this.drawVerticalLines()

        /* Calculate font size and space between scale lines */
        const { canvasFont, hstep, sstep } = this.calculateStepAndFontPixels()
        this.ctx.font = canvasFont + "px monospace"

        /* Draw horizontal scale */
        this.drawHorizontalLines(hstep, canvasFont, sstep)

        /* Draw time stamps */
        if (this.timestamps) this.drawTimestamps(sstep, canvasFont)

        /* Draw graph */
        this.drawGraph()
    }
}

function getTimestamp() {
    const d = new Date()

    const timestampString =
        (d.getHours() < 10 ? "0" : "") +
        d.getHours() +
        (d.getMinutes() < 10 ? ":0" : ":") +
        d.getMinutes() +
        (d.getSeconds() < 10 ? ":0" : ":") +
        d.getSeconds()

    return timestampString
}

/* Helper function to take a value value and return y-coordinate for the canvas */
function scaleInvert(value, minVal, maxVal, height) {
    return (1 - (value - minVal) / (maxVal - minVal)) * height
}

function shiftArrayRowLeft(array, row, ncols, newVal) {
    for (let i = 0; i < ncols - 1; i++) array[row][i] = array[row][i + 1]

    array[row][ncols - 1] = newVal

    return array
}

function emptyArray(nrows, ncols, fill = undefined) {
    const arr = []

    for (let i = 0; i < nrows; i++) {
        arr[i] = []
        for (let j = 0; j < ncols; j++) arr[i][j] = fill
    }

    return arr
}

function colorArray(len) {
    const colorArray = []

    for (let i = 0; i < len; i++) colorArray[i] = colors[i % colors.length]

    return colorArray
}
