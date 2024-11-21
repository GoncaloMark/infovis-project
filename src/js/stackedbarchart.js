// Bar Chart Initialization
const initializeStackedBarChart = (stackedBarChartElement, margin, width, height) => {
    // Create the SVG container
    const svg = d3.select(stackedBarChartElement)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    return { svg };
};

// Update Bar Chart for Genre Data
const updateStackedBarChart = (svg, genreData, labels, width, height, colorScheme) => {
    // Clear existing chart content
    svg.selectAll('*').remove();

    // Create scales
    const x = d3.scaleBand()
        .domain(genreData.map(d => d.genre)) // Use genre names as x-axis
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(genreData.flatMap(d => d.data.flatMap(yearData => yearData[labels[1]])))])
        .range([height, 0]);

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

    // Add Y axis
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


    // Draw bars for each genre
    svg.append('g')
        .selectAll('g')
        .data(genreData)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${x(d.genre)},0)`)
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

// Export the functions for external use
export { initializeStackedBarChart, updateStackedBarChart };
