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
    y.domain([minValue < 0 ? minValue * 2 : 0, maxValue * 1.1]);

    // Clear previous paths and axes
    svg.selectAll('*').remove();

    // Create grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickSize(-height)
            .tickFormat('')
        )
        .style('stroke', '#ccc')
        .style('stroke-width', '0.5px');

    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickSize(-width)
            .tickFormat('')
        )
        .style('stroke', '#ccc')
        .style('stroke-width', '0.5px');

    // Render new lines and points (circles for each data point)
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

        svg.selectAll(`circle-${genreObj.genre}`)
            .data(genreObj.data)
            .enter()
            .append('circle')
            .attr('cx', d => x(d.year))
            .attr('cy', d => y(d[metric]))
            .attr('r', 4)
            .attr('fill', color(index))
            .on('click', (event, d) => {

            const tooltip = d3.select('.tooltip-line');
            tooltip.transition().duration(200).style('opacity', 1);  // Show tooltip
            tooltip.html(`
                <strong>Genre</strong>: ${genreObj.genre}<br>
                <strong>Year</strong>: ${d.year}<br>
                <strong>${metric}</strong>: ${d[metric]}
                `)
                .style('left', `${event.pageX + 10}px`)  // Position the tooltip slightly to the right of the cursor
                .style('top', `${event.pageY + 10}px`); // Position the tooltip slightly below the cursor

            // Prevent the event from bubbling up to the document click event
            event.stopPropagation();
            
            });
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
        d3.select(lineChart)
            .append('div')
            .attr('class', 'legend-container-line')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('margin-top', '20px');
    } else {
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