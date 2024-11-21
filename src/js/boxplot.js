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

const updateBoxPlot = (svg, data, genres, color, boxWidth, width, height) => {
    const boxData = getBoxplotData(data);

    // Clear previous elements
    svg.selectAll('*').remove();

    // Update scales
    x.domain(genres);
    y.domain([
        d3.min(boxData.flatMap(d => [d.stats.min])) * 1.5,
        d3.max(boxData.flatMap(d => [d.stats.max])) * 1.1
    ]);

    // Draw axes
    const xAxis = svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

    xAxis.selectAll('text')
        .style('font-size', '12px');

    xAxis.selectAll('path, line')
        .style('stroke', '#ccc');

    svg.append('g')
        .call(d3.axisLeft(y))
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
        .style('stroke-width', '0.5px')

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
        svg.append('rect')
            .attr('x', x(genre) + x.bandwidth() / 2 - boxWidth / 2)
            .attr('y', y(stats.q3))
            .attr('height', y(stats.q1) - y(stats.q3))
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
    });
};

export { initializeBoxPlot, updateBoxPlot };