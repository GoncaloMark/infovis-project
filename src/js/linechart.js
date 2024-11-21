// Constants
const x = d3.scaleLinear();
const y = d3.scaleLinear();

// Line Chart Initialization
const initializeLineChart = (lineChartElement, margin, width, height) => {
    const svg = d3.select(lineChartElement)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const legendContainer = d3.select(lineChartElement)
        .append('div')
        .attr('class', 'legend-container-line')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('margin-top', '20px');

    x.range([0, width]);
    y.range([height, 0]);

    return { svg, legendContainer };
};

const updateLineChart = (lineChart, svg, data, metric, color, width, height) => {
    // Update x and y domains
    const allYears = data.flatMap(g => g.data.map(d => d.year));
    x.domain([d3.min(allYears), d3.max(allYears)]);

    // Get the metric values
    const allMetricValues = data.flatMap(g => g.data.map(d => d[metric]));

    // Calculate the min and max of the metric values
    const minValue = d3.min(allMetricValues);
    const maxValue = d3.max(allMetricValues);

    // Update y domain
    y.domain([
        minValue < 0 ? minValue * 2 : minValue,  // Multiply minValue by 1.5 only if it's negative
        maxValue * 1.1  // Always multiply the max value by 1.1
    ]);

    // Clear previous paths and axes
    svg.selectAll('*').remove();

    // Create grid lines
    // Add grid lines for the x-axis
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(5)  // Set the number of ticks
            .tickSize(-height)  // Length of grid lines
            .tickFormat('')  // Hide the tick labels
        )
        .style('stroke', '#ccc')  // Grid line color
        .style('stroke-width', '0.5px');

    // Add grid lines for the y-axis
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
            .ticks(5)  // Set the number of ticks
            .tickSize(-width)  // Length of grid lines
            .tickFormat('')  // Hide the tick labels
        )
        .style('stroke', '#ccc')  // Grid line color
        .style('stroke-width', '0.5px')

    // Render new lines
    data.forEach((genreObj, index) => {
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d[metric]));

        svg.append('path')
            .datum(genreObj.data)
            .attr('fill', 'none')
            .attr('stroke', color(index))
            .attr('stroke-width', 2)
            .attr('d', line);
    });

    // Add axes
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .selectAll('path, line')
        .style('stroke', '#ccc');

    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y))
        .selectAll('path, line')
        .style('stroke', '#ccc');

    // Update legend
    const legend = d3.select(lineChart).select('.legend-container-line');
    if (!legend.node()) {
        // Create a container for the legend if it doesn't exist
        d3.select(lineChart)
            .append('div')
            .attr('class', 'legend-container-line')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('margin-top', '20px');
    } else {
        // Clear the existing legend content
        legend.selectAll('*').remove();
    }

    data.forEach((genreObj, index) => {
        legend.append('div')
            .style('margin', '0 20px')
            .style('font-size', '12px')
            .html(`
                        <span style="display:inline-block;width:10px;height:10px;background-color:${color(index)};"></span>
                        ${genreObj.genre}
                    `);
    });
};

const updateLineChartWindow = (plot, svg, data, metric, color, margin) => {
        const width = plot.clientWidth - margin.left - margin.right;
        const height = plot.clientHeight - margin.top - margin.bottom;

        // Update the SVG dimensions
        d3.select(plot).select('svg')
            .attr('width', plot.clientWidth)
            .attr('height', plot.clientHeight);

        x.range([0, width]);
        y.range([height, 0]);

        updateLineChart(plot, svg, data, metric, color, width, height);
}

export { initializeLineChart, updateLineChart, updateLineChartWindow };