HOW OUR VISUALIZATION WORKS:

Line Chart:

Hover over the dots on the line chart to see details on demand, such as the year, fuel type, and miles traveled.
Click on a line or multiple lines to highlight a specific fuel type and filter the data in both the line chart and the Sankey diagram. Click again to deselect it.
Sankey Diagram:

Hover over the links and nodes to view details about the fuel sources, modes of transportation, and miles traveled.
When a fuel type is selected in the line chart, the Sankey diagram highlights the relevant paths while dimming others for better clarity.


# Put the JavaScript code you write in this folder

We recommend you separate the implementation details for individual visualizations using the [Reusable Charts](https://bost.ocks.org/mike/chart/) framework Mike Bostock advocates.
Broadly this means implementing visualizations as closures with getter-setter methods.
This can be further extended to [making updatable charts](https://www.toptal.com/d3-js/towards-reusable-d3-js-charts).