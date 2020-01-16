![Picograph logo](picographicon128.png)
# picograph.js
Simple and tiny graphing library for javascript.

[Download picograph.js](picograph.js)

# Demo
![Demo Image](demo_screenshot.png)
```html
<!DOCTYPE html>
<html>
    <head>
        <title>PicoGraphDemo</title>
        <script src="picograph.js"></script>
    </head>
    <body style="font-family: Lucida Console, Monaco, monospace;">
        
        <h1>PicoGraphDemo</h1>
        
        <!-- Canvas for thr graph -->
        <canvas id="graphDemo" 
            style="width: 900px; height:200px; border:2px solid #000000;">
        </canvas>
        
        <!-- div for legends/labels -->
        <div id="graphLabels"></div>

        <script>
            /* Create graph using picograph */
            var demograph = createGraph("graphDemo", ["Random Y0", "Random Y1"], "units",
                "graphLabels", 20, 10);

            /* Update values every second */
            setInterval(updateEverySecond, 1000);

            function updateEverySecond() {
                /* Get new values */
                yrand0 = Math.random()*10;
                yrand1 = Math.random()*10;

                /* Update graph */
                demograph.update(yrand0, 0);
                demograph.update(yrand1, 1)
            }

        </script>
    </body>
</html>
```

# Documentation
[Download picograph.js](picograph.js)

```javascript
function createGraph(canvasID, labels, unit, labelDivID, intervalSize, maxVal, scalesteps=5)
```
**Arguments** :

+ **canvasID** : The id of `<canvas>` tag for the graph.
+ **labels** : List/array of string for label names.
+ **unit** : The unit for the values.
+ **labelDivID**: ID of the `<div>` tag to place graph labels/legend.
+ **intervalSize**: Amount to shift the graph on update.
+ **maxVal**: Approximate maximum value. Picograph can autoscale, this 
argument is only for initial value.
+ **scalesteps**: Number of scale lines to draw on the graph.

**Returns** : `Graph` object.

```javascript
Graph.update(yval, labelID)
```
**Arguments** :

+ **yval** : New value to plot.
+ **labelID** : The index of the label to add the point to 
(in `Labels` argument in `createGraph`).

# Note
Always use CSS or `style` to set height and width of the canvas. 
Do not use `height` and `width` attributes of the canvas tag, it may cause scaling issues.

**Correct Way:**
```html
<canvas id="graphDemo" style="width: 900px; height:200px">
```

**Incorrect Way:**
```html
<canvas id="graphDemo" width=900 height=200">
```