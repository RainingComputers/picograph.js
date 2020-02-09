/*
    PicoGraph, graphing library for Javascript,

    Copyright Vishnu Shankar B,
    https://github.com/RainingComputers
*/

colors = [
    "#e52b50", "#008000", "#0000ff", "#ff00ff",
    "#a52a2a", "#00008b", "#008b8b", "#a9a9a9", 
    "#006400", "#bdb76b", "#8b008b", "#556b2f", 
    "#ff8c00", "#9932cc", "#8b0000", "#e9967a", 
    "#9400d3", "#ff00ff",  "#ffd700", "#008000", 
    "#4b0082", "#f0e68c", "#add8e6", "#e0ffff", 
    "#90ee90", "#d3d3d3", "#ffb6c1", "#ffffe0", 
    "#800000", "#000080", "#808000", "#ffa500", 
    "#ffc0cb", "#800080", "#800080", "#ff0000", 
    "#c0c0c0", "#ffffff", "#ffff00"
]

var byID = function(id) { return document.getElementById(id); };

/* Helper function for creating graphs */
function createGraph(canvasID, labels, unit, labelDivID, intervalSize, maxVal, 
    vlines=false, timestamps=false, scalesteps=5)
{
    /* Create valueIDs for each label */
    valueIDs = []
    for(var i = 0; i < labels.length; i++) {
        valueIDs[i] = canvasID + labels[i].replace(" ", "") + "value";
    }

    /* Create graph  */
    var canvas = byID(canvasID);
    var graph = new Graph(canvas, labels.length, valueIDs, unit, intervalSize, maxVal, 
        vlines, timestamps, scalesteps);

    /* Set label colors */
    for(var i = 0; i < labels.length; i++)
    {
        var colorID = valueIDs[i] + "color";
        
        byID(labelDivID).innerHTML += `
            <div style="display: inline-block; padding-left: 2em;">
                <svg width="10" height="10">
                    <rect id="${colorID}" width="10" height="10"/>
                </svg> 
                <span>${labels[i]}:</span>
                <span id="${valueIDs[i]}"></span>
            <div>
        `

        labelcolor = graph.colors[i];
        byID(colorID).style = "fill:"+labelcolor;
    }

    return graph;
}

/* Graph class, plots and updates graphs */
class Graph
{
    constructor(canvas, noLabels, valueIDs, unit, intervalSize, maxVal, vlines, timestamps, scalesteps)
    {
        /* Get the drawing context */
        this.canvas = canvas;
        var ctx = canvas.getContext("2d");
        this.ctx = ctx;
        
        /* Set proper height and width */
        this.setWidthHeight()

        /* Initialize class variables */
        this.scalesteps = scalesteps
        this.noLabels = noLabels;
        this.intervalSize = intervalSize;
        this.nValuesFloat = this.width/intervalSize
        this.nValues = Math.round(this.nValuesFloat)+1;
        this.points = emptyArray(noLabels, this.nValues);
        this.timestamps_array = emptyArray(1, this.nValues, "");
        this.colors = colorArray(noLabels);
        this.maxVal = maxVal;
        this.valueIDs = valueIDs;
        this.unit = unit;
        this.vlines = vlines;
        this.timestamps = timestamps;
    }

    setWidthHeight()
    {
        this.cssScale = window.devicePixelRatio;

        /* Set canvas height and width */
        this.canvas.width = this.canvas.clientWidth*this.cssScale;
        this.canvas.height = this.canvas.clientHeight*this.cssScale;
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
    }

    update(values)
    {
        for(var i = 0; i < this.noLabels; i++) {
            /* Update scale */
            if(values[i] > this.maxVal) {
                this.maxVal = values[i];
            }

            /* Shift new point into points array */
            this.points = shiftArrayRowLeft(this.points, i, this.nValues, values[i]);

            /* Update value */
            byID(this.valueIDs[i]).innerHTML = values[i].toFixed(2)+' '+this.unit;
        } 

        /* Log time and add to timestamps_array array */
        var d = new Date();
        var timestamp_str = d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
        this.timestamps_array = shiftArrayRowLeft(this.timestamps_array, 0, this.nValues, timestamp_str);

        /* Clear canvas */
        this.ctx.clearRect(0, 0, this.width, this.height);

        /* Set proper height and width */
        this.setWidthHeight()

        /* update interval size */
        this.intervalSize = this.width/this.nValuesFloat;

        /* Set line width */
        this.ctx.lineWidth = 2*this.cssScale;

        /* Set font for canvas */
        this.ctx.font = (10*this.cssScale)+"px monospace";

        /* Draw vertical scale */
        if(this.vlines)
        {
            for(var i = this.nValues-1; i >= 0; i--)
            {
                /* Calculate line coordinates */
                var x = (i+1)*this.intervalSize;
    
                /* Draw line */
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.height);
                this.ctx.strokeStyle = "#e3e3e3";
                this.ctx.stroke();
            }   
        }

        /* Draw horizontal scale */
        var hstep = this.height/this.scalesteps;
        var sstep = this.maxVal/this.scalesteps;
        for(var i = 1; i <= this.scalesteps; i++)
        {
            var y = this.height-i*hstep
            var xoffset = 2*this.cssScale;
            var yoffset = 12*this.cssScale;
            this.ctx.fillText((i*sstep).toFixed(2), xoffset, y+yoffset);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.strokeStyle = "#e3e3e3";
            this.ctx.stroke();
        }
        
        /* Draw time stamps */
        if(this.timestamps)
        {
            var xBoundPix = this.ctx.measureText((this.scalesteps*sstep).toFixed(2)).width;
            var xBound = Math.floor((xBoundPix/this.intervalSize)+1)
            for(var i = this.nValues-1; i >= xBound; i--)
            {
                /* Calculate line coordinates */
                var x = (i+1)*this.intervalSize;
    
    
                /* Put time stamps */
                var xoffset = 12*this.cssScale;
                var yoffset = this.ctx.measureText(this.timestamps_array[0][i]).width+4*this.cssScale;
                this.ctx.rotate(Math.PI/2);
                this.ctx.fillText(this.timestamps_array[0][i], this.height-yoffset, -x+xoffset);
                this.ctx.stroke();
                this.ctx.rotate(-Math.PI/2);
            }               
        }  

        /* Draw graph */
        for(var i = 0; i < this.noLabels; i++)
        {
            for(var j = this.nValues-1; j > 0; j--)
            {
                /* Calculate line coordinates */
                var xstart = (j+1)*this.intervalSize;
                var xend = j*this.intervalSize;
                var ystart = scaleInvert(this.points[i][j], this.maxVal, this.height);
                var yend = scaleInvert(this.points[i][j-1], this.maxVal, this.height);
                
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
function scaleInvert(value, maxVal, height)
{
    return (1 - value/maxVal) * height;
}

/* Helper function that shifts the contents of row to left */
function shiftArrayRowLeft(array, row, ncols, newVal)
{
    for(var i = 0; i < ncols-1; i++) {
        array[row][i] = array[row][i+1];
    }

    array[row][ncols-1] = newVal;

    return array;
}

/* Helper function to create an empty */
function emptyArray(nrows, ncols, fill=0) 
{
    var arr = [];
    for(var i = 0; i < nrows; i++) {
        arr[i] = [];
        for(var j = 0; j < ncols; j++) {
            arr[i][j] = fill;
        }
    }
    return arr;
}

/* Helper function to create array of colors */
function colorArray(len)
{
    var colorArray = [];
    for(var i = 0; i < len; i++)
    {
        colorArray[i] = colors[i%colors.length];
    }
    return colorArray;
}