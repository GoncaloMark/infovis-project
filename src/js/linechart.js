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

    return { svg, legendContainer };
};

const updateLineChart = (lineChart, svg, data, metric, x, y, color, height) => {
    // Update x and y domains
    const allYears = data.flatMap(g => g.data.map(d => d.year));
    x.domain([d3.min(allYears), d3.max(allYears)]);
    y.domain([0, d3.max(data.flatMap(g => g.data), d => d[metric])]);

    // Clear previous paths and axes
    svg.selectAll('path').remove();
    svg.selectAll('.x-axis').remove();
    svg.selectAll('.y-axis').remove();

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

export { initializeLineChart, updateLineChart };