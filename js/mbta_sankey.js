/* To create the Parallel diagram, we used the following articles as refrence: 
 1) From Graphing Libraries --> https://plotly.com/python/sankey-diagram/ 
 2) Join.js --> https://www.jointjs.com/demos/sankey-diagram?utm_term=sankey%20diagram%20javascript&utm_campaign=Search+Ads+%7C+Worldwide+%7C+React+Diagram+KWs&utm_source=adwords&utm_medium=ppc&hsa_acc=9744511829&hsa_cam=20933992049&hsa_grp=157792034379&hsa_ad=687381533216&hsa_src=g&hsa_tgt=kwd-2270153174793&hsa_kw=sankey%20diagram%20javascript&hsa_mt=p&hsa_net=adwords&hsa_ver=3&gad_source=1&gclid=CjwKCAiAxqC6BhBcEiwAlXp45yGly8LxM4gy1iRcovKJb71jU_Mn0yyHWT6eNesi5VSTqGrlm6hRpBoCs9kQAvD_BwE
 
 Information above also Included in the Acknowledgments portion of the html file.

The sankey diagram structure needs:
    ~Nodes: in our case this will be the fuel type and modes of transportation
    ~Links: the connection between the nodes wich will be the miles traveled

   Also included node mapping because I kep getting "d3-sankey.min.js:2 Uncaught Error: missing: Diesel" 
*/
/* Sankey Diagram: Brushing and linking with centralized state. */

import { state, subscribe } from './state.js';

d3.json("data/Fuel_and_Energy_cleaned.json").then((dataset) => {
    const nodeMap = new Map();
    let nodeIndex = 0;

    // Map nodes to indices
    dataset.forEach((row) => {
        const fuelSource = row.Fuel_Source.trim();
        const mode = row.Mode.trim();
        if (!nodeMap.has(fuelSource)) nodeMap.set(fuelSource, nodeIndex++);
        if (!nodeMap.has(mode)) nodeMap.set(mode, nodeIndex++);
    });

    const nodes = Array.from(nodeMap.keys()).map((name) => ({ name }));

    // Aggregate links data
    const linksMap = {};
    dataset.forEach((row) => {
        const sourceIndex = nodeMap.get(row.Fuel_Source.trim());
        const targetIndex = nodeMap.get(row.Mode.trim());

        const key = `${sourceIndex}->${targetIndex}`;
        if (!linksMap[key]) {
            linksMap[key] = { source: sourceIndex, target: targetIndex, value: 0 };
        }
        linksMap[key].value += row.Miles_Traveled;
    });

    const links = Object.values(linksMap);
    const sankeyData = { nodes, links };

    renderSankey(sankeyData);
});

// Function to render the Sankey Diagram
function renderSankey(data) {
    const margin = { top: 20, right: 200, bottom: 50, left: 150 };
    const width = 800 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    const svg = d3
        .select("#sankey-diagram")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const sankey = d3
        .sankey()
        .nodeWidth(20)
        .nodePadding(15)
        .size([width, height]);

    const sankeyData = sankey({
        nodes: data.nodes.map((d) => Object.assign({}, d)),
        links: data.links.map((d) => Object.assign({}, d)),
    });

    const tooltip = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "20")
        .style("visibility", "hidden")
        .style("color", "white")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "5px");

    const nodeColors = {
        Diesel: "#FF0000",
        Gasoline: "#1E90FF",
        "Electric Propulsion": "#008000",
        "Compressed Natural Gas": "#FFA500",
        "Other Fuel": "#8A2BE2",
    };

    // Draw links
    const links = svg
        .append("g")
        .selectAll("path")
        .data(sankeyData.links)
        .enter()
        .append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", (d) => Math.max(1, d.width))
        .style("fill", "none")
        .style("stroke", (d) => {
            const sourceNode = d.source;
            return nodeColors[sourceNode.name] || "#ccc";
        })
        .style("opacity", 0.5)
        .on("mouseover", function (event, d) {
            if (
                state.selectedFuelTypes.includes(d.source.name) ||
                state.selectedFuelTypes.length === 0
            ) {
                const milesInMillions = (d.value / 1e6).toFixed(1);
                const tooltipMiles = `${milesInMillions}M`;
                d3.select(this).style("opacity", 1);
                tooltip
                    .html(
                        `<strong>Miles Traveled:</strong> ${tooltipMiles}<br>
                         <strong>Fuel Source:</strong> ${d.source.name}<br>
                         <strong>Mode:</strong> ${d.target.name}`
                    )
                    .style("visibility", "visible");
            }
        })
        .on("mousemove", function (event) {
            tooltip
                .style("top", `${event.pageY - 100}px`)
                .style("left", `${event.pageX - 100}px`);
        })
        .on("mouseout", function (event, d) {
            tooltip.style("visibility", "hidden");
            
        // Reset opacity based on state
        d3.select(this).style("opacity", (d) =>
            state.selectedFuelTypes.length === 0 ||
            state.selectedFuelTypes.includes(d.source.name)
                ? 0.5 // Default transparency
                : 0.1 // Dim other links
        );    
        });

    // Draw nodes
    const nodes = svg
        .append("g")
        .selectAll("rect")
        .data(sankeyData.nodes)
        .enter()
        .append("rect")
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0)
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .style("fill", (d) => nodeColors[d.name] || "#ccc")
        .style("stroke", "#000")
        .style("opacity", 1)
        .on("mouseover", function (event, d) {
            if (
                state.selectedFuelTypes.includes(d.name) ||
                state.selectedFuelTypes.length === 0
            ) {
                tooltip.html(`<strong>Node:</strong> ${d.name}`).style("visibility", "visible");
            }
        })
        .on("mousemove", function (event) {
            tooltip
                .style("top", `${event.pageY - 100}px`)
                .style("left", `${event.pageX - 100}px`);
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
        });

    // Add node labels
    svg
        .append("g")
        .selectAll("text")
        .data(sankeyData.nodes)
        .enter()
        .append("text")
        .attr("x", (d) => (d.x0 === 0 ? d.x0 - 5 : d.x1 + 10))
        .attr("y", (d) => (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", (d) => (d.x0 === 0 ? "end" : "start"))
        .text((d) => d.name)
        .style("font-size", "12px")
        .style("fill", "#000")
        .style("pointer-events", "none");

    // Subscribe to state changes to update opacity
    subscribe(({ selectedFuelTypes }) => {
        links.style("opacity", (d) =>
            selectedFuelTypes.length === 0 || selectedFuelTypes.includes(d.source.name) ? 0.5 : 0.1
        );

        nodes.style("opacity", (d) =>
            selectedFuelTypes.length === 0 || selectedFuelTypes.includes(d.name) ? 1 : 0.2
        );
    });
}
