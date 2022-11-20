/*
    PicoGraph, graphing library for Javascript,

    Copyright Vishnu Shankar B,
    https://github.com/RainingComputers
*/

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
    const labelSpan = `<span>${label}</span>`
    const valueSpan = label.at(-1) == ":" ? `<span id="${valueID}"></span>` : ""

    byID(labelDivID).innerHTML += `
        <div style="display: inline-block;">
            <svg width="10" height="10">
                <rect width="10" height="10" style="fill: ${color}"/>
            </svg> 
            ${labelSpan}
            ${valueSpan}
        <div>
    `
}

/* Graph class, plots and updates graphs */
class Graph {
    constructor(
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
        const valueIDs = createValueIDs(labels, canvasID)

        this.initializeElements(canvasID, labelDivID, valueIDs)

        this.setConfig(
            labels,
            unit,
            maxVal,
            minVal,
            vlines,
            timestamps,
            scalesteps,
            vlinesFreq,
            autoScaleMode
        )

        this.resetState(intervalSize)

        if (byID(labelDivID).innerHTML === "") this.createLegends()
    }

    initializeElements(canvasID, labelDivID, valueIDs) {
        this.canvas = byID(canvasID)
        this.ctx = this.canvas.getContext("2d")
        this.setWidthHeightAndCssScale()
        this.labelDivID = labelDivID
        this.valueIDs = valueIDs
    }

    setConfig(
        labels,
        unit,
        maxVal,
        minVal,
        vlines,
        timestamps,
        scalesteps,
        vlinesFreq,
        autoScaleMode
    ) {
        this.labels = labels
        this.unit = unit
        this.vlinesFreq = vlinesFreq
        this.vlines = vlines
        this.timestamps = timestamps
        this.noLabels = labels.length
        this.colors = colorArray(this.noLabels)
        this.setScalingConfig(maxVal, minVal, scalesteps, autoScaleMode)
    }

    setScalingConfig(maxVal, minVal, scalesteps, autoScaleMode) {
        this.maxVal = maxVal
        this.minVal = minVal
        this.scalesteps = scalesteps
        this.autoScaleMode = autoScaleMode

        /* If autoscaling is disabled (or out of range) and min / max are not set, hard-set them to 0 and 100 respectively */
        if ([1, 2].includes(autoScaleMode) == false) {
            this.autoScaleMode = 0
            if (Number.isFinite(minVal) === false) this.minVal = 0
            if (Number.isFinite(maxVal) === false) this.maxVal = 100
        }
    }

    resetState(intervalSize) {
        this.intervalSize = intervalSize * this.cssScale
        this.nPointsFloat = this.width / this.intervalSize
        this.nPoints = Math.round(this.nPointsFloat) + 1
        this.points = emptyArray2D(this.noLabels, this.nPoints)
        this.timestampsArray = emptyArray(this.nPoints, "")
        this.fontSize = null
        this.hstep = null
        this.sstep = null
    }

    createLegends() {
        byID(this.labelDivID).innerHTML = ""

        for (let i = 0; i < this.noLabels; i++)
            createLegendRect(
                this.labelDivID,
                this.colors[i],
                this.labels[i] + ":",
                this.valueIDs[i]
            )
    }

    updateConfig(
        labels,
        unit,
        intervalSize,
        maxVal,
        minVal = 0,
        vlines = false,
        timestamps = false,
        scalesteps = 5,
        vlinesFreq = 1,
        autoScaleMode = 1
    ) {
        this.clear()

        this.setConfig(
            labels,
            unit,
            maxVal,
            minVal,
            vlines,
            timestamps,
            scalesteps,
            vlinesFreq,
            autoScaleMode
        )

        this.resetState(intervalSize)

        this.createLegends()
    }

    setColors(colors) {
        this.colors = colors
        this.createLegends()
    }

    updateMinMax(value) {
        if (value < this.minVal) this.minVal = value

        if (value > this.maxVal) this.maxVal = value

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
            if (value > this.maxVal - valueMinMaxDelta * 0.05) this.maxVal = newMaxVal

            if (value < this.minVal + valueMinMaxDelta * 0.05) this.minVal = newMinVal
        }
    }

    updatePoints(values) {
        for (let i = 0; i < this.noLabels; i++) {
            /* Update scale */
            if (this.autoScaleMode > 0) this.updateMinMax(values[i])

            /* Shift new point into points array */
            this.points[i] = shiftArrayLeft(this.points[i], values[i])
        }
    }

    updateLegends(values) {
        for (let i = 0; i < this.noLabels; i++)
            byID(this.valueIDs[i]).innerHTML = values[i].toFixed(2) + " " + this.unit
    }

    updateTimestamps() {
        const timestampString = getTimestamp()

        this.timestampsArray = shiftArrayLeft(this.timestampsArray, timestampString)
    }

    drawVerticalLines() {
        for (let i = this.nPoints - 1; i >= 0; i -= this.vlinesFreq) {
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

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height)
    }

    setWidthHeightAndCssScale() {
        this.cssScale = window.devicePixelRatio
        this.canvas.width = this.canvas.clientWidth * this.cssScale
        this.canvas.height = this.canvas.clientHeight * this.cssScale
        this.width = this.ctx.canvas.width
        this.height = this.ctx.canvas.height
    }

    setIntervalSizeAndLineWidth() {
        this.intervalSize = this.width / this.nPointsFloat
        this.ctx.lineWidth = 2 * this.cssScale
    }

    setStepAndFontSizePixels() {
        this.hstep = this.height / this.scalesteps
        this.sstep = (this.maxVal - this.minVal) / this.scalesteps
        this.fontSize = Math.min(0.5 * this.hstep, 15 * this.cssScale)
        this.ctx.font = this.fontSize + "px monospace"
    }

    drawHorizontalLines() {
        let entityDecode = document.createElement("textarea")
        entityDecode.innerHTML = this.unit

        for (let i = 1; i <= this.scalesteps; i++) {
            const y = this.height - i * this.hstep
            const xoffset = 2
            const yoffset = this.fontSize + 2 * this.cssScale
            this.ctx.fillText(
                (i * this.sstep + this.minVal).toFixed(2) + " " + entityDecode.value,
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

    drawTimestamps() {
        const xBoundPix = this.ctx.measureText((this.scalesteps * this.sstep).toFixed(2)).width
        const xBound = Math.floor(xBoundPix / this.intervalSize + 1) + 1

        for (let i = this.nPoints - 1; i >= xBound; i -= this.vlinesFreq) {
            /* Calculate line coordinates */
            const x = (i + 1) * this.intervalSize

            /* Put time stamps */
            const xoffset = this.fontSize + 2 * this.cssScale
            const yoffset = this.ctx.measureText(this.timestampsArray[i]).width + 4 * this.cssScale
            this.ctx.rotate(Math.PI / 2)
            this.ctx.fillText(this.timestampsArray[i], this.height - yoffset, -x + xoffset)
            this.ctx.stroke()
            this.ctx.rotate(-Math.PI / 2)
        }
    }

    drawGraph() {
        for (let i = 0; i < this.noLabels; i++) {
            for (let j = this.nPoints - 1; j > 0; j--) {
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
        this.updatePoints(values)
        this.updateLegends(values)
        this.updateTimestamps()

        this.clear()
        this.setWidthHeightAndCssScale()
        this.setIntervalSizeAndLineWidth()
        this.setStepAndFontSizePixels()

        if (this.vlines) this.drawVerticalLines()
        this.drawHorizontalLines()
        if (this.timestamps) this.drawTimestamps()
        this.drawGraph()
    }
}

function switchGraph(previousGraph, newGraph) {
    previousGraph.clear()
    newGraph.createLegends()
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

function shiftArrayLeft(array, newVal) {
    array.shift()
    array.push(newVal)
    return array
}

function emptyArray2D(nrows, ncols, fill = undefined) {
    return Array.from({ length: nrows }, (_) => Array.from({ length: ncols }, (_) => fill))
}

function emptyArray(length, fill = undefined) {
    return Array.from({ length }, (_) => fill)
}

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

function colorArray(len) {
    const colorArray = []

    for (let i = 0; i < len; i++) colorArray[i] = colors[i % colors.length]

    return colorArray
}
