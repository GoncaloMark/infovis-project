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
        .attr('transform', `translate(${margin.left + 10},${margin.top})`);

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

const updateLineChart = (lineChart, svg, data, metric, color, width, height, label) => {
    // Update x and y domains
    const allYears = data.flatMap(g => g.data.map(d => d.year));
    x.domain([d3.min(allYears), d3.max(allYears)]);

    // Get the metric values
    const allMetricValues = data.flatMap(g => g.data.map(d => d[metric]));

    // Calculate the min and max of the metric values
    const minValue = d3.min(allMetricValues);
    const maxValue = d3.max(allMetricValues);
    console.log(metric)
    let append = ''
    switch (metric) {
        case 'budget':
        case 'revenue':
            append = "$";
            break;
    }

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
                d3.select("#expandData").classed("disabled", false);

                console.log(genreObj.data)

                const tooltip = d3.select('.tooltip-line');
                tooltip.transition().duration(200).style('opacity', 1); // Show tooltip


                // Get the horizontal and vertical scroll offsets of the scrolling container
                const scrollContainer = document.body; // Use the <body> element or change to the appropriate container
                const scrollLeft = scrollContainer.scrollLeft; // Horizontal scroll offset

                tooltip
                    .html(`
                        <strong>${label.charAt(0).toUpperCase() + label.slice(1)}</strong>: ${genreObj[label]}<br>
                        <strong>Year</strong>: ${d.year}<br>
                        <strong>${metric.charAt(0).toUpperCase() + metric.slice(1)}</strong>: ${append ? append + (d[metric] / 1e6).toFixed(2) : d[metric]}${append ? 'M' : ''}
                    `)
                    .style('left', `${event.pageX + 10 - 250 + scrollLeft}px`) // Position tooltip to the right of the cursor
                    .style('top', `${event.pageY + 10}px`); // Position tooltip below the cursor

                // Prevent event bubbling
                event.stopPropagation();

                // Update the table header
                const tableHeader = `
                <tr>
                <th scope="col">Year</th>
                <th scope="col">Title</th>
                ${metric !== 'films_released' ? `<th scope="col">${metric.charAt(0).toUpperCase() + metric.slice(1)}</th>` : ''}
                </tr>`;
                d3.select('#movieTableBody')
                    .html(''); // Clear the table body

                d3.select('#movieTableHead')
                    .html(tableHeader); // Update the table header

                // Populate the table with movies related to the data
                const movies = d.films; // Assuming `movies` is an array of movie data
                // Sort the movies by the selected metric
                const sortedMovies = movies.sort((a, b) => b[metric] - a[metric]);
                sortedMovies.forEach(movie => {
                    d3.select('#movieTableBody').append('tr').html(`
                        <td>${movie.release_year}</td>
                        <td>${movie.title}</td>
                        ${metric === 'budget' || metric === 'revenue' ? `<td>$${(movie[metric] / 1e6).toFixed(2)}M</td>` : `<td>${append}${movie[metric]}</td>`}
                    `);
                });

                // Update the title and subtitle
                d3.select('#movieSidebar h5').html('<strong>Line Chart - Movie Details</strong>');
                d3.select('#movieSidebar').select('h5').append('h6').text(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${genreObj[label]}`);
                // Update the year
                d3.select('#movieSidebar').select('h5').append('h6').html(`<em>${d.year}</em>`).style('margin', '0');

                // Button that when clicked expands the data in the sidebar to show all columns
                d3.select('#expandData').on('click', () => {
                    // Update the table header
                    const tableHeader = `
                    <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Title</th>
                    <th scope="col">Popularity</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Budget</th>
                    <th scope="col">Revenue</th>
                    <th scope="col">ROI</th>
                    <th scope="col">Director(s)</th>
                    <th scope="col">Cast</th>
                    </tr>`;

                    d3.select('#movieTableBody')
                        .html(''); // Clear the table body

                    d3.select('#movieTableHead')
                        .html(tableHeader); // Update the table header

                    sortedMovies.forEach(movie => {
                        // Create hyperlinks for directors
                        const directorLinks = movie.director.split(',').map(director =>
                            `<a href="./directors.html?director=${encodeURIComponent(director.trim())}" target="_blank">${director.trim()}</a>`
                        ).join(', ');

                        // Create hyperlinks for cast members
                        const castLinks = movie.cast.split(',').map(actor =>
                            `<a href="./actors.html?actor=${encodeURIComponent(actor.trim())}" target="_blank">${actor.trim()}</a>`
                        ).join(', ');

                        // Append the row to the table body
                        d3.select('#movieTableBody').append('tr').html(`
                                <td>${movie.release_year}</td>
                                <td class="nowrap-cell">${movie.title}</td>
                                <td>${movie.popularity}</td>
                                <td>${movie.vote_average}</td>
                                <td>$${(movie.budget / 1e6).toFixed(2)}M</td>
                                <td>$${(movie.revenue / 1e6).toFixed(2)}M</td>
                                <td>${movie.roi}</td>
                                <td><div class="scrollable-cell">${directorLinks}</div></td>
                                <td><div class="scrollable-cell">${castLinks}</div></td>
                            `);
                    });

                });

                d3.select('body').on('click', () => {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0);
                });
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
        .call(d3.axisLeft(y).tickFormat(d => `${append ? append + (d / 1e6).toFixed(2) : d}${append ? 'M' : ''}`))
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
                ${genreObj[label]}
            `);
    });
};


const updateLineChartWindow = (plot, svg, data, metric, color, margin, label) => {
    const width = plot.clientWidth - margin.left - margin.right;
    const height = plot.clientHeight - margin.top - margin.bottom;

    // Update the SVG dimensions
    d3.select(plot).select('svg')
        .attr('width', plot.clientWidth)
        .attr('height', plot.clientHeight);

    x.range([0, width]);
    y.range([height, 0]);

    updateLineChart(plot, svg, data, metric, color, width, height, label);
}

export { initializeLineChart, updateLineChart, updateLineChartWindow };