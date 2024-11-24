const x = d3.scaleBand()
    .padding(0.5);

const y = d3.scaleLinear();
/**
 * Generate boxplot data for a dynamic label based on ROI.
 * @param {Array} data - An array of objects containing label and aggregated data.
 * @param {String} labelKey - The key used for dynamic labeling (e.g., 'genre', 'director').
 * @returns {Array} - An array of objects containing label and boxplot data.
 */
function getBoxplotData(data, labelKey) {
    return data.map(({ [labelKey]: label, data }) => {
        // Flatten ROI values across all years for the given label
        const roiValues = data
            .map(d => d.roi)
            .filter(v => !isNaN(v) && isFinite(v));

        if (roiValues.length === 0) {
            return {
                [labelKey]: label,
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
            [labelKey]: label,
            stats: { min, q1, median, q3, max }
        };
    });
}

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

const updateBoxPlot = (svg, data, color, boxWidth, width, height, labelKey) => {
    const boxData = getBoxplotData(data, labelKey);
    const labels = boxData.map(d => d[labelKey]);

    // Clear previous elements
    svg.selectAll('*').remove();

    // Update scales
    x.domain(labels);
    y.domain([d3.min(boxData.flatMap(d => [d.stats.min])) * 1.5, d3.max(boxData.flatMap(d => [d.stats.max])) * 1.1]);

    // Draw axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).tickFormat(d => `$${d}`);

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
        const { [labelKey]: label, stats } = d;

        // Whiskers
        svg.append('line')
            .attr('x1', x(label) + x.bandwidth() / 2)
            .attr('x2', x(label) + x.bandwidth() / 2)
            .attr('y1', y(stats.min))
            .attr('y2', y(stats.max))
            .attr('stroke', 'black');

        // Box
        const box = svg.append('rect')
            .attr('x', x(label) + x.bandwidth() / 2 - boxWidth / 2)
            .attr('y', y(stats.q3))
            .attr('height', Math.max(0, y(stats.q1) - y(stats.q3))) // Prevent negative height
            .attr('width', boxWidth)
            .attr('stroke', 'black')
            .style('fill', color(index));

        // Median line
        svg.append('line')
            .attr('x1', x(label) + x.bandwidth() / 2 - boxWidth / 2)
            .attr('x2', x(label) + x.bandwidth() / 2 + boxWidth / 2)
            .attr('y1', y(stats.median))
            .attr('y2', y(stats.median))
            .attr('stroke', 'black');

        // Add click event for tooltip
        box.on('click', function (event) {
            // Set tooltip content
            const tooltipContent = `
                <strong>${labelKey.charAt(0).toUpperCase() + labelKey.slice(1)}:</strong> ${label}<br>
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

            // Update the table header
            const tableHeader = `
                <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Title</th>
                    <th scope="col">ROI (%)</th>
                    <th scope="col">Budget ($)</th>
                    <th scope="col">Revenue ($)</th>
                </tr>`;
            d3.select('#movieTableBody')
                .html(''); // Clear the table body

            d3.select('#movieTableHead')
                .html(tableHeader); // Update the table header

            // Populate the table with movies related to the data
            const genreObj = data.find(d => d[labelKey] === label);

            // Unpack the movies from the genre object, and sort them by the roi metric
            const movies = genreObj.data.flatMap(d => d.films);
            // Sort the movies by the selected metric
            const sortedMovies = movies.sort((a, b) => b['roi'] - a['roi']);
            sortedMovies.forEach(movie => {
                d3.select('#movieTableBody').append('tr').html(`
                <td>${movie.release_year}</td>
                <td>${movie.title}</td>
                <td>${movie['roi']}</td>
                <td>${movie['budget']}</td>
                <td>${movie['revenue']}</td>
            `);
            });
        });
    });
};

const updateBoxPlotWindow = (plot, svg, data, color, margin, boxWidth, labelKey) => {
    const width = plot.clientWidth - margin.left - margin.right;
    const height = plot.clientHeight - margin.top - margin.bottom;

    // Update the SVG dimensions
    d3.select(plot).select('svg')
        .attr('width', plot.clientWidth)
        .attr('height', plot.clientHeight);

    x.range([0, width]);
    y.range([height, 0]);

    // Update box plot with the new dimensions and scales
    updateBoxPlot(svg, data, color, boxWidth, width, height, labelKey);
};

export { initializeBoxPlot, updateBoxPlot, updateBoxPlotWindow };
