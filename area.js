// Draw the stacked area graph
function draw() {

    // Create SVG and padding for the chart
    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("height", 200)
        .attr("width", 400);

    const strokeWidth = 0;
    const margin = { top: 0, bottom: 20, left: 30, right: 20 };
    const chart = svg.append("g").attr("transform", `translate(${margin.left},0)`);

    const width = +svg.attr("width") - margin.left - margin.right - strokeWidth * 2;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    const grp = chart
        .append("g")
        .attr("transform", `translate(-${margin.left - strokeWidth},-${margin.top})`);

    // Create stack
    const stack = d3.stack().keys(["recovered", "healthy", "infected"]);
    const stackedValues = stack(data);
    const stackedData = [];
    // Copy the stack offsets back into the data.
    stackedValues.forEach((layer, index) => {
        const currentStack = [];
        layer.forEach((d, i) => {
            currentStack.push({
                values: d,
                time: data[i].time
            });
        });
        stackedData.push(currentStack);
    });

    // Create scales
    const yScale = d3
        .scaleLinear()
        .range([0, height])
        .domain([0, BALL_COUNT]);
    const xScale = d3
        .scaleLinear()
        .range([0, width])
        .domain([0,BALL_COUNT*15]);

    const area = d3
        .area()
        .x(dataPoint => xScale(dataPoint.time))
        .y0(dataPoint => yScale(dataPoint.values[0]))
        .y1(dataPoint => yScale(dataPoint.values[1]));

    // Actual draw area
    const series = grp
    .selectAll(".series")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("class", "series");

    series.append("path")
    .attr("transform", `translate(${margin.left},0)`)
    .style("fill", (d, i) => BALL_COLORS[i])
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", strokeWidth)
    .attr("d", d => area(d));

    // Add the X Axis
    chart
        .append("g")
        .attr("transform", `translate(0,${height})`);

    // Add the Y Axis
    chart
        .append("g")
        .attr("transform", `translate(0, 0)`);
}