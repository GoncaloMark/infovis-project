const x = d3.scaleLinear();
const y = d3.scaleBand().padding(0.5);

// Horizontal Bar Chart Initialization
const initializeHorizontalBarChart = (chartElement, margin, width, height) => {
    // Create container
    const svg = d3.select(chartElement)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left + 10},${margin.top})`);

    x.range([0, width]);
    y.range([0, height]);

    return { svg };
};

// Update Horizontal Bar Chart
const updateHorizontalBarChart = (svg, data, width, height, x_axis, y_axis, color) => {
    // Clear existing chart content
    svg.selectAll('*').remove();
    const processedData = data.map(d => ({
        Y: d[y_axis],
        data: d.data,
        X: d3.mean(d.data, d => d[x_axis])
    }));

    // console.log(processedData)

    // Update scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.X)]) // Get max from params
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(processedData.map(d => d.Y))
        .range([0, height])
        .padding(0.2);

    const xAxis = svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));

    xAxis.selectAll('path, line')
        .style('stroke', '#ccc');

    xAxis.selectAll('text')
        .style('font-size', '12px');

    const yAxis = svg.append('g')
        .call(d3.axisLeft(y));

    yAxis.selectAll('path, line')
        .style('stroke', '#ccc');

    yAxis.selectAll('text')
        .style('font-size', '12px');

    // Add bars
    svg.selectAll('.bar')
        .data(processedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.Y))
        .attr('width', d => x(d.X))
        .attr('height', y.bandwidth())
        .style('fill', (d, i) => color(i))
        .on('click', (event, d) => {
            const tooltip = d3.select('.tooltip-bchart');
            console.log("CLICK")
            tooltip.transition()
                .duration(100)
                .style('opacity', 1); // Show tooltip

            // Get the horizontal and vertical scroll offsets of the scrolling container
            const scrollContainer = document.body; // Use the <body> element or change to the appropriate container
            const scrollLeft = scrollContainer.scrollLeft; // Horizontal scroll offset

            tooltip.html(`
                    <strong>Genre:</strong> ${d.Y}<br>
                    <strong>Vote Average:</strong> ${d.X.toFixed(2)}
                `)
                .style('left', `${event.clientX + window.scrollX + 10 - 250 + scrollLeft}px`) // Adjust for horizontal scroll
                .style('top', `${event.clientY + window.scrollY + 10}px`); // Adjust for vertical scroll


            event.stopPropagation(); // Prevent event bubbling

            const tableHeader = `
                <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Title</th>
                </tr>`;
            d3.select('#movieTableBody')
                .html(''); // Clear the table body

            d3.select('#movieTableHead')
                .html(tableHeader); // Update the table header

            // Populate the table with movies related to the data
            const movies = d.data.flatMap(d => d.films); // Assuming `movies` is an array of movie data
            console.log(movies)
            // Sort the movies by the selected metric
            const sortedMovies = movies.sort((a, b) => b['vote_average'] - a['vote_average']);
            sortedMovies.forEach(movie => {
                d3.select('#movieTableBody').append('tr').html(`
                    <td>${movie.release_year}</td>
                    <td>${movie.title}</td>
                    <td>${movie[x_axis]}</td>
                `);
            });

            // Update the title and subtitle
            d3.select('#movieSidebar h5').html('<strong>Line Chart - Movie Details</strong>');
            d3.select('#movieSidebar').select('h5').append('h6').text(`Genre: ${d.Y}`);

            d3.select('body').on('click', () => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0);
            });
        });

    // Add grid lines 
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickSize(height)
            .tickFormat('')
        )
        .style('stroke', '#ccc')
        .style('stroke-width', '0.5px');
};

// Responsive Chart Update
const updateHorizontalBarChartWindow = (plot, svg, data, margin, color) => {
    const width = plot.clientWidth - margin.left - margin.right;
    const height = plot.clientHeight - margin.top - margin.bottom;

    // Update the SVG dimensions
    d3.select(plot).select('svg')
        .attr('width', plot.clientWidth)
        .attr('height', plot.clientHeight);

    x.range([0, width]);
    y.range([0, height]);

    updateHorizontalBarChart(svg, data, width, height, "vote_average", "genre", color);
};

export {
    initializeHorizontalBarChart,
    updateHorizontalBarChart,
    updateHorizontalBarChartWindow
};
