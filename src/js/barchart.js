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
        .attr('transform', `translate(${margin.left+10},${margin.top})`);

    x.range([0, width]);
    y.range([0, height]);

    return { svg };
};

// Update Horizontal Bar Chart
const updateHorizontalBarChart = (svg, data, width, height) => {
    // Clear existing chart content
    svg.selectAll('*').remove();
    const processedData = data.map(d => ({
        genre: d.genre,
        voteAvg: d3.mean(d.data, d => d.vote_average) // Get from params
    }));

    // Update scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.voteAvg)]) // Get max from params
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(processedData.map(d => d.genre)) 
        .range([0, height]) 
        .padding(0.2); 

    const color = d3.scaleOrdinal()
        .domain(processedData.map(d => d.genre))
        .range(['#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d']); // Get color from params

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
        .attr('y', d => y(d.genre)) 
        .attr('width', d => x(d.voteAvg))
        .attr('height', y.bandwidth()) 
        .style('fill', d => color(d.genre)); 

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
const updateHorizontalBarChartWindow = (plot, svg, data, margin) => {
    const width = plot.clientWidth - margin.left - margin.right;
    const height = plot.clientHeight - margin.top - margin.bottom;

    // Update the SVG dimensions
    d3.select(plot).select('svg')
        .attr('width', plot.clientWidth)
        .attr('height', plot.clientHeight);

    x.range([0, width]);
    y.range([0, height]);

    updateHorizontalBarChart(svg, data, width, height);
};

export {
    initializeHorizontalBarChart,
    updateHorizontalBarChart,
    updateHorizontalBarChartWindow
};
