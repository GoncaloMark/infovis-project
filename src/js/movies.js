// Load data from '../../data/movies.csv'
d3.csv('../../data/movies.csv').then(data => {
    console.log(data);

    // Data structure adjustments
    data.forEach(d => {
        d.popularity = parseFloat(d.popularity); // Ensure popularity is a number
        d.vote_average = parseFloat(d.vote_average); // Ensure vote_average is a number
        d.release_year = parseInt(d.release_date.split('-')[0]); // Extract release year
    });

    // Get a list of all unique genres
    const genres = data.map(d => d.genres.split(', ')).flat();
    const uniqueGenres = [...new Set(genres)];
    uniqueGenres.sort();
    console.log(uniqueGenres);

    // Get the oldest and most recent years
    const years = data.map(d => d.release_year);
    const oldestYear = Math.min(...years);
    const mostRecentYear = Math.max(...years);
    console.log(oldestYear, mostRecentYear);

    // Populate genres list with checkboxes
    const genreList = document.getElementById('genreList');
    uniqueGenres.forEach(genre => {
        const li = document.createElement('li');
        li.className = 'genre list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
        ${genre}
        <input type="checkbox" class="form-check-input" />
        `;
        genreList.appendChild(li);
    });

    // Filter movies from 1970 to today and only include released movies
    const filteredData = data.filter(d => d.release_year >= 1970 && d.status === 'Released');

    // Prepare data for the first 5 genres
    const selectedGenres = uniqueGenres.slice(0, 5);
    const genreData = selectedGenres.map(genre => {
        const movies = filteredData.filter(d => d.genres.includes(genre));
        const moviesByYear = d3.group(movies, d => d.release_year);
        const averagePopularityByYear = Array.from(moviesByYear, ([year, movies]) => {
            return {
                year: +year,
                popularity: d3.mean(movies, d => d.popularity),
                vote_average: d3.mean(movies, d => d.vote_average),
                revenue: d3.mean(movies, d => d.revenue),
                budget: d3.mean(movies, d => d.budget),
                roi: d3.mean(movies, d => d.revenue / d.budget),
                films_released: movies.length
            };
        }).sort((a, b) => a.year - b.year);

        return {
            genre,
            data: averagePopularityByYear
        };
    });
    console.log(genreData);

    // Create the line chart
    const lineChart1 = document.getElementById('test1');
    const margin = { top: 20, right: 30, bottom: 20, left: 70 };
    const width = lineChart1.clientWidth - margin.left - margin.right;
    const height = lineChart1.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(lineChart1)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);


    // Define scales
    const x = d3.scaleLinear()
        .domain([1970, mostRecentYear])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(genreData.flatMap(g => g.data), d => d.popularity)])
        .range([height, 0]);

    // Add axes
    svg.append('g')
        .attr('class', 'x-axis')  // Add class here
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append('g')
        .attr('class', 'y-axis')  // Add class here
        .call(d3.axisLeft(y));


    // Define a color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add lines for each genre
    genreData.forEach((genreObj, index) => {
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.popularity));

        svg.append('path')
            .datum(genreObj.data)
            .attr('fill', 'none')
            .attr('stroke', color(index))
            .attr('stroke-width', 2)
            .attr('d', line);
    });

    // Add a legend below the graph
    const legend = d3.select(lineChart1).append('div')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('margin-top', '10px');

    selectedGenres.forEach((genre, index) => {
        legend.append('div')
            .style('margin', '0 10px')
            .html(`
                <span style="display:inline-block;width:12px;height:12px;background-color:${color(index)};"></span>
                ${genre}
            `);
    });

    // Dropdown change event handler
    d3.select('#metricDropdown').on('change', function () {
        const selectedMetric = this.value;

        // Update the y scale based on selected metric
        const updatedYDomain = selectedMetric === 'popularity'
            ? [0, d3.max(genreData.flatMap(g => g.data), d => d.popularity)]
            : selectedMetric === 'rating'
                ? [0, d3.max(genreData.flatMap(g => g.data), d => d.vote_average)]
                : [0, d3.max(genreData.flatMap(g => g.data), d => d[selectedMetric])]; // Adjust for other metrics

        console.log(updatedYDomain);

        // Update y scale domain
        y.domain(updatedYDomain);

        // Clear previous graph paths (the lines)
        d3.select('#test1 svg').selectAll('path').remove();

        // Clear previous axes
        d3.select('#test1 svg').selectAll('.x-axis').remove();
        d3.select('#test1 svg').selectAll('.y-axis').remove();

        // Re-render the lines for each genre
        genreData.forEach((genreObj, index) => {
            const line = d3.line()
                .x(d => x(d.year))  // x is your x scale, assuming you have it defined
                .y(d => y(d[selectedMetric])); // Use the selected metric

            // Append the new lines for each genre
            d3.select('#test1 svg g')
                .append('path')
                .datum(genreObj.data)
                .attr('fill', 'none')
                .attr('stroke', color(index))  // Assuming 'color' function is defined to pick colors
                .attr('stroke-width', 2)
                .attr('d', line);
        });

        // Re-render the axes with the updated y scale
        d3.select('#test1 svg g')
            .append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        d3.select('#test1 svg g')
            .append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));
    });
});
