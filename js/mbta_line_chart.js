/* To create the brushing and Linking, we used the following articles as refrence: 
 1)Enhancing The Clickable Area Size --> https://ishadeed.com/article/clickable-area/ by Ahmad Shadeed
 
 Information above also Included in the Acknowledgments portion of the html file.
 */

 import { state, updateState, subscribe } from './state.js';

// Load the data
d3.json("data/Fuel_and_Energy_cleaned.json").then((data) => {
    // Aggregate the data by Year and Fuel_Source
    const aggregatedData = d3.rollups(
        data,
        (v) => d3.sum(v, (d) => d.Miles_Traveled),
        (d) => d.Year,
        (d) => d.Fuel_Source
    );

    const flatData = [];
    aggregatedData.forEach(([year, fuelSources]) => {
        fuelSources.forEach(([fuelSource, miles]) => {
            flatData.push({
                Year: +year,
                FuelType: fuelSource,
                Miles: miles,
            });
        });
    });

    const nestedData = d3.groups(flatData, (d) => d.FuelType);

    // Tooltip for details on demand.
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "20")
        .style("visibility", "hidden")
        .style("color", "white")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .text("a simple tooltip");

    // Set up dimensions and margins
    const margin = { top: 20, right: 200, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#linechart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create X scale
    const xScale = d3.scalePoint()
        .domain(flatData.map((d) => d.Year))
        .range([0, width])
        .padding(0.5);

    // Create Y scale
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(flatData, (d) => d.Miles)])
        .range([height, 0]);

    // Map a color for each fuel type
    const colorScale = d3.scaleOrdinal()
        .domain([
            "Diesel",
            "Gasoline",
            "Electric Propulsion",
            "Other Fuel",
            "Compressed Natural Gas",
        ])
        .range(["#FF0000", "#1E90FF", "#008000", "#8A2BE2", "#FFA500"]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat((d) => `${d / 1e6}M`));

    // Add axis legends
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2) 
        .attr("y", height + margin.bottom - 10)
        .style("font-size", "14px")
        .text("Years");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2) 
        .attr("y", -margin.left + 20) 
        .style("font-size", "14px")
        .text("Miles Traveled (in Millions)");

    // Line generator
    const line = d3.line()
        .x((d) => xScale(d.Year))
        .y((d) => yScale(d.Miles));

    // Create lines for each fuel type
    svg.selectAll(".line-group")
        .data(nestedData)
        .enter()
        .append("g")
        .attr("class", "line-group")
        .each(function ([fuelType, values]) {
            const group = d3.select(this);

            // Make the clickable area bigger for brushing and linking
            group.append("path")
                .attr("class", "line-click-area")
                .attr("fill", "none")
                .attr("stroke-width", 20)
                .attr("stroke", "transparent")
                .attr("d", line(values))
                .on("click", function () {
                    const isAlreadySelected = state.selectedFuelTypes.includes(fuelType);
                    const updatedFuelTypes = isAlreadySelected
                        ? state.selectedFuelTypes.filter((f) => f !== fuelType)
                        : [...state.selectedFuelTypes, fuelType];
                    updateState({ selectedFuelTypes: updatedFuelTypes });
                });

                group.append("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colorScale(fuelType))
                .attr("stroke-width", 2)
                .attr("d", line(values));
        });

    // Add points to each data point
    nestedData.forEach(([fuelType, values]) => {
        svg.selectAll(`.point-${fuelType}`)
            .data(values)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", (d) => xScale(d.Year))
            .attr("cy", (d) => yScale(d.Miles))
            .attr("r", 3)
            .on("mouseover", function (event, d) {
                if (
                    state.selectedFuelTypes.includes(d.FuelType) ||
                    state.selectedFuelTypes.length === 0
                ) {
                    const milesInMillions = (d.Miles / 1e6).toFixed(1);
                    tooltip.html(
                        `<strong>Year:</strong> ${d.Year}<br>
                         <strong>Miles Traveled:</strong> ${milesInMillions}M<br>
                         <strong>Fuel Source:</strong> ${d.FuelType}`
                    ).style("visibility", "visible");
                }
            })
            .on("mousemove", function (event) {
                tooltip.style("top", `${event.pageY - 100}px`).style(
                    "left",
                    `${event.pageX - 100}px`
                );
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
            });
    });

    // Subscribe to state changes to update the chart
    subscribe(({ selectedFuelTypes }) => {
        svg.selectAll(".line")
            .style("opacity", ([fuelType]) =>
                selectedFuelTypes.length === 0 || selectedFuelTypes.includes(fuelType)
                    ? 1
                    : 0.25
            );

        svg.selectAll(".point")
            .style("opacity", (d) =>
                selectedFuelTypes.length === 0 || selectedFuelTypes.includes(d.FuelType)
                    ? 1
                    : 0.1
            );
    });

    // Creates legend
    svg.selectAll(".legend")
        .data(nestedData)
        .enter()
        .append("text")
        .attr("x", width + 30)
        .attr("y", (d, i) => i * 20)
        .attr("fill", ([fuelType]) => colorScale(fuelType))
        .style("font-size", "12px")
        .text(([fuelType]) => fuelType);
});
