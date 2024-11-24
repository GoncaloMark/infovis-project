// Scales
const x = d3.scaleBand()
    .padding(0.5);
const y = d3.scaleLinear();

// Bar Chart Initialization
const initializeStackedBarChart = (stackedBarChartElement, margin, width, height) => {
    // Create the SVG container
    const svg = d3.select(stackedBarChartElement)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left+10},${margin.top})`);

    x.range([0, width]);
    y.range([height, 0]);

    return { svg };
};

// Update Bar Chart for Genre Data
const updateStackedBarChart = (svg, genreData, labels, width, height, prop, color) => {
    // Clear existing chart content
    svg.selectAll('*').remove();

    // Update scales
    x.domain(genreData.map(d => d[prop]));
    y.domain([0, d3.max(genreData.flatMap(d => d.data.flatMap(yearData => yearData[labels[1]])))]);

    // Draw axes
    const xAxis = svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

    xAxis.selectAll('text')
        .style('font-size', '12px');

    xAxis.selectAll('path, line')
        .style('stroke', '#ccc');

    const yAxis = d3.axisLeft(y).tickFormat(d => `$${d}`);

    // Add Y axis
    svg.append('g')
        .call(yAxis)
        .selectAll('path, line')
        .style('stroke', '#ccc');

    // Add grid lines for the y-axis
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
            .ticks(5)  // Set the number of ticks
            .tickSize(-width)  // Length of grid lines
            .tickFormat('')  // Hide the tick labels
        )
        .style('stroke', '#ccc')  // Grid line color
        .style('stroke-width', '0.5px');

    // Draw bars for each genre
    svg.append('g')
        .selectAll('g')
        .data(genreData)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${x(d[prop])},0)`)
        .selectAll('rect')
        .data((d, clusterIndex) => labels.map((label, barIndex) => ({
            key: label,
            value: d3.mean(d.data, yearData => yearData[label]),
            clusterIndex, // Pass the cluster index for color mapping
            barIndex, // Pass the bar index to decide lighter or darker
        })))
        .enter()
        .append('rect')
        .attr('x', (d, i) => x.bandwidth() / labels.length * i)
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth() / labels.length)
        .attr('height', d => height - y(d.value))
        .attr('fill', d => {
            const baseColor = d3.color(color(d.clusterIndex)); // Get color for the cluster
            if (d.barIndex === 0) {
                // Lighten the color for the second bar
                baseColor.opacity = 0.6;
                return baseColor.toString();
            }
            return baseColor.toString(); // Normal color for the first bar
        })
        .attr('stroke', 'none'); // Remove border (optional, adjust as needed)
};

const updateStackedBarChartWindow = (plot, svg, data, labels, margin, prop, color) => {
    const width = plot.clientWidth - margin.left - margin.right;
    const height = plot.clientHeight - margin.top - margin.bottom;

    // Update the SVG dimensions
    d3.select(plot).select('svg')
        .attr('width', plot.clientWidth)
        .attr('height', plot.clientHeight);

    x.range([0, width]);
    y.range([height, 0]);

    updateStackedBarChart(svg, data, labels, width, height, prop, color );
};  

// Export the functions for external use
export { initializeStackedBarChart, updateStackedBarChart, updateStackedBarChartWindow };
