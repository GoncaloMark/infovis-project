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

    xAxis.selectAll('text').style('font-size', '12px');
    xAxis.selectAll('path, line').style('stroke', '#ccc');

    const yAxis = d3.axisLeft(y).tickFormat(d => `$${d}`);
    svg.append('g').call(yAxis).selectAll('path, line').style('stroke', '#ccc');

    // Add grid lines for the y-axis
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
        .style('stroke', '#ccc').style('stroke-width', '0.5px');

    // Tooltip element
    const tooltip = d3.select('.tooltip-line'); // Ensure this exists in your HTML

    // Draw bars
    const barGroups = svg.append('g')
        .selectAll('g')
        .data(genreData)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${x(d[prop])},0)`);

    barGroups.selectAll('rect')
        .data((d, clusterIndex) => labels.map((label, barIndex) => ({
            key: label,
            value: d3.mean(d.data, yearData => yearData[label]),
            clusterIndex,
            barIndex,
            genreData: d,
        })))
        .enter()
        .append('rect')
        .attr('x', (d, i) => (x.bandwidth() / labels.length) * i)
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth() / labels.length)
        .attr('height', d => height - y(d.value))
        .attr('fill', d => {
            const baseColor = d3.color(color(d.clusterIndex));
            if (d.barIndex === 0) {
                baseColor.opacity = 0.6;
                return baseColor.toString();
            }
            return baseColor.toString();
        })
        .attr('stroke', 'none')
        .on('click', (event, d) => {
            // Tooltip interaction
            tooltip.transition().duration(200).style('opacity', 1);

            tooltip.html(`
                <strong>${prop.charAt(0).toUpperCase() + prop.slice(1)}</strong>: ${d.genreData[prop]}<br>
                <strong>${labels[d.barIndex]}</strong>: ${d.value.toFixed(2)}
            `)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY + 10}px`);

            // Update sidebar
            d3.select('#movieSidebar h5').html('<strong>Cluster Bar Chart - Movie Details</strong>');
            d3.select('#movieSidebar').select('h5')
                .append('h6').text(`${prop}: ${d.genreData[prop]}`);
            d3.select('#movieSidebar').select('h5')
                .append('h6').html(`<em>${labels[d.barIndex]}: ${d.value.toFixed(2)}</em>`).style('margin', '0');

            // Update table header
            const tableHeader = `
                <tr>
                <th scope="col">Year</th>
                <th scope="col">Title</th>
                <th scope="col">Budget</th>
                <th scope="col">Revenue</th>
                <th scope="col">ROI</th>
                </tr>`;
            d3.select('#movieTableHead').html(tableHeader);

            // Update table body
            const movies = d.genreData.data.flatMap(yearData => yearData.films || []);
            const sortedMovies = movies.sort((a, b) => b[labels[d.barIndex]] - a[labels[d.barIndex]]);
            d3.select('#movieTableBody').html(''); // Clear table body
            sortedMovies.forEach(movie => {
                d3.select('#movieTableBody').append('tr').html(`
                    <td>${movie.release_year}</td>
                    <td>${movie.title}</td>
                    <td>${movie.budget}</td>
                    <td>${movie.revenue}</td>
                    <td>${movie.roi}%</td>
                `);
            });

            // Prevent event bubbling
            event.stopPropagation();

            // Hide tooltip on body click
            d3.select('body').on('click', () => {
                tooltip.transition().duration(200).style('opacity', 0);
            });
        });
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
