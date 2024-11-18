function barChart(path, labels, groups) {
    // Load the CSV file
    d3.csv(path).then(data => {
        // Parse numeric values for specified labels
        data.forEach(d => {
            labels.forEach(label => {
                d[label] = +d[label];
            });
        });

        // Filter data to only include rows matching the groups (director names)
        const filteredData = data.filter(d => groups.includes(d.director_name));

        // Aggregate data by director_name
        const aggregatedData = groups.map(group => {
            const groupData = filteredData.filter(d => d.director_name === group);
            const aggregatedValues = {};
            labels.forEach(label => {
                aggregatedValues[label] = d3.sum(groupData, d => d[label]);
            });
            return { group, ...aggregatedValues };
        });

        // Set up dimensions and margins
        const barChart = document.getElementById('barChart');
        const margin = { top: 20, right: 30, bottom: 50, left: 80 };
        const width = barChart.clientWidth - margin.left - margin.right;
        const height = barChart.clientHeight - margin.top - margin.bottom;

        // Compute max domain dynamically
        const max_dom = d3.max(aggregatedData.flatMap(d => labels.map(label => d[label])));

        // Create the SVG container
        const svg = d3.select(barChart)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scales
        const x = d3.scaleBand()
            .domain(groups) // Use the provided groups (director names)
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, max_dom])
            .range([height, 0]);

        const xSubgroup = d3.scaleBand()
            .domain(labels) // Use labels for subgroups
            .range([0, x.bandwidth()])
            .padding(0.05);

        const color = d3.scaleOrdinal()
            .domain(labels)
            .range(d3.schemeCategory10); // Dynamic color scheme

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-30)")
            .style("text-anchor", "end");

        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Draw bars
        svg.append("g")
            .selectAll("g")
            .data(aggregatedData)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${x(d.group)},0)`)
            .selectAll("rect")
            .data(d => labels.map(label => ({ key: label, value: d[label] })))
            .enter()
            .append("rect")
            .attr("x", d => xSubgroup(d.key))
            .attr("y", d => y(d.value))
            .attr("width", xSubgroup.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", d => color(d.key));
    });
}
