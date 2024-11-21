/**
 * Generate boxplot data for genres based on ROI, using genreData.
 * @param {Array} genreData - An array of objects containing genre and aggregated data.
 * @returns {Array} - An array of objects containing genre and boxplot data.
 */
function getBoxplotData(genreData) {
    return genreData.map(({ genre, data }) => {
        // Flatten ROI values across all years for the given genre
        const roiValues = data
            .map(d => d.roi)
            .filter(v => !isNaN(v) && isFinite(v));

        if (roiValues.length === 0) {
            return {
                genre,
                stats: { min: null, q1: null, median: null, q3: null, max: null }
            };
        }

        // Calculate boxplot statistics
        roiValues.sort(d3.ascending);
        const q1 = d3.quantile(roiValues, 0.25);
        const median = d3.quantile(roiValues, 0.5);
        const q3 = d3.quantile(roiValues, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(d3.min(roiValues), q1 - 1.5 * iqr);
        const max = Math.min(d3.max(roiValues), q3 + 1.5 * iqr);

        return {
            genre,
            stats: { min, q1, median, q3, max }
        };
    });
}

const x = d3.scaleBand()
    .padding(0.5);

const y = d3.scaleLinear();

// Box Plot Initialization
const initializeBoxPlot = (boxPlotElement, margin, width, height) => {
    const svg = d3.select(boxPlotElement)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    x.range([0, width]);
    y.range([height, 0]);

    return { svg };
};

const updateBoxPlot = (svg, data, color, boxWidth, width, height) => {
    const boxData = getBoxplotData(data);
    const genres = boxData.map(d => d.genre);

    // Clear previous elements
    svg.selectAll('*').remove();

    // Update scales
    x.domain(genres);
    y.domain([d3.min(boxData.flatMap(d => [d.stats.min])) * 1.5, d3.max(boxData.flatMap(d => [d.stats.max])) * 1.1]);

    // Draw axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-size', '12px');

    svg.append('g')
        .call(yAxis);

    // Add grid lines for the y-axis
    svg.append('g')
        .attr('class', 'grid')
        .call(
            d3.axisLeft(y)
                .ticks(5) // Set the number of ticks
                .tickSize(-width) // Length of grid lines
                .tickFormat('') // Hide the tick labels
        )
        .selectAll('line')
        .style('stroke', '#ccc') // Grid line color
        .style('stroke-width', '0.5px');

    // Draw boxplots
    boxData.forEach((d, index) => {
        const { genre, stats } = d;

        // Whiskers
        svg.append('line')
            .attr('x1', x(genre) + x.bandwidth() / 2)
            .attr('x2', x(genre) + x.bandwidth() / 2)
            .attr('y1', y(stats.min))
            .attr('y2', y(stats.max))
            .attr('stroke', 'black');

        // Box
        const box = svg.append('rect')
            .attr('x', x(genre) + x.bandwidth() / 2 - boxWidth / 2)
            .attr('y', y(stats.q3))
            .attr('height', Math.max(0, y(stats.q1) - y(stats.q3))) // Prevent negative height
            .attr('width', boxWidth)
            .attr('stroke', 'black')
            .style('fill', color(index));

        // Median line
        svg.append('line')
            .attr('x1', x(genre) + x.bandwidth() / 2 - boxWidth / 2)
            .attr('x2', x(genre) + x.bandwidth() / 2 + boxWidth / 2)
            .attr('y1', y(stats.median))
            .attr('y2', y(stats.median))
            .attr('stroke', 'black');

        // Add click event for tooltip
        box.on('click', function (event) {

            // Set tooltip content
            const tooltipContent = `
                <strong>Genre:</strong> ${genre}<br>
                <strong>Max:</strong> ${stats.max}<br>
                <strong>Q3:</strong> ${stats.q3}<br>
                <strong>Median:</strong> ${stats.median}<br>
                <strong>Q1:</strong> ${stats.q1}<br>
                <strong>Min:</strong> ${stats.min}
            `;

            // Display the tooltip at the mouse position
            const tooltip = d3.select('.tooltip-box');
            tooltip.transition().duration(200).style('opacity', 1);  // Show tooltip
            tooltip.html(tooltipContent)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY + 10}px`)
                .style('opacity', 1);

            // Prevent the event from bubbling up to the document click event
            event.stopPropagation();
        });
    });
};


const updateBoxPlotWindow = (plot, svg, data, color, margin, boxWidth) => {
    const width = plot.clientWidth - margin.left - margin.right;
    const height = plot.clientHeight - margin.top - margin.bottom;

    // Update the SVG dimensions
    d3.select(plot).select('svg')
        .attr('width', plot.clientWidth)
        .attr('height', plot.clientHeight);

    x.range([0, width]);
    y.range([height, 0]);

    // Update box plot with the new dimensions and scales
    updateBoxPlot(svg, data, color, boxWidth, width, height);
};

export { initializeBoxPlot, updateBoxPlot, updateBoxPlotWindow };