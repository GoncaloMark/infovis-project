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
const updateStackedBarChart = (svg, genreData, labels, width, height, prop) => {
    // Clear existing chart content
    svg.selectAll('*').remove();

    // Update scales
    x.domain(genreData.map(d => d[prop]));
    y.domain([0, d3.max(genreData.flatMap(d => d.data.flatMap(yearData => yearData[labels[1]])))])

    const color = d3.scaleOrdinal()
        .domain(labels)
        .range(['black', 'white']);

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
        .data(d => labels.map(label => ({
            key: label,
            value: d3.mean(d.data, yearData => yearData[label])
        })))
        .enter()
        .append('rect')
        .attr('x', (d, i) => x.bandwidth() / labels.length * i)
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth() / labels.length)
        .attr('height', d => height - y(d.value))
        .attr('fill', d => color(d.key))
        .attr('stroke', d => d.key === labels[1] ? 'black' : 'none') // Add border to rectangles of the second label
        .attr('stroke-width', d => d.key === labels[1] ? 1 : 0); // Set border width
};

const updateStackedBarChartWindow = (plot, svg, data, labels, margin, prop) => {
    const width = plot.clientWidth - margin.left - margin.right;
    const height = plot.clientHeight - margin.top - margin.bottom;

    // Update the SVG dimensions
    d3.select(plot).select('svg')
        .attr('width', plot.clientWidth)
        .attr('height', plot.clientHeight);

    x.range([0, width]);
    y.range([height, 0]);

    updateStackedBarChart(svg, data, labels, width, height, prop);
};  

// Export the functions for external use
export { initializeStackedBarChart, updateStackedBarChart, updateStackedBarChartWindow };
