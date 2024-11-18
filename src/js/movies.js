// Load data from '../../data/movies.csv'
d3.csv('../../data/movies.csv').then(data => {

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
    // TODO : Make this filter in the data treatment
    const filteredData = data.filter(d => d.release_year >= 1970 && d.status === 'Released');

    /**
     * Generate genre data for a given list of genres, filtering by starting year.
     * @param {Array} genres - An array of genre strings.
     * @param {Array} data - The movie data array.
     * @param {Number} startingYear - The minimum release year to include.
     * @returns {Array} - An array of objects containing genre and its aggregated data.
     */
    function getGenreData(genres, data, startingYear) {
        return genres.map(genre => {
            // Filter movies that include the genre and meet the starting year criteria
            const movies = data.filter(d => d.genres.includes(genre) && d.release_year >= startingYear);

            // Group movies by release year
            const moviesByYear = d3.group(movies, d => d.release_year);

            // Aggregate data for each year
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

            // Return the genre and its aggregated data
            return {
                genre,
                data: averagePopularityByYear
            };
        });
    }

    // Example usage:
    const selectedGenres = uniqueGenres.slice(0, 5); // Or any list of genres you want
    const startingYear = 2010; // Set the desired starting year
    const genreData = getGenreData(selectedGenres, filteredData, startingYear);

    /* ----- Line Chart ----- */
    const lineChart = document.getElementById('test1');
    const margin = { top: 20, right: 30, bottom: 20, left: 70 };
    const width = lineChart.clientWidth - margin.left - margin.right;
    const height = lineChart.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(lineChart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([oldestYear, mostRecentYear])
        .range([0, width]);

    const y = d3.scaleLinear().range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const updateLineChart = (data, metric) => {
        // Update x and y domains
        const allYears = data.flatMap(g => g.data.map(d => d.year));
        x.domain([d3.min(allYears), d3.max(allYears)]);
        y.domain([0, d3.max(data.flatMap(g => g.data), d => d[metric])]);
    
        // Remove previous paths and axes
        svg.selectAll('path').remove();
        svg.selectAll('.x-axis').remove();
        svg.selectAll('.y-axis').remove();
    
        // Render new lines
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
            .call(d3.axisLeft(y))
            .selectAll('path, line')
            .style('stroke', '#ccc');
    };
    
    // Render initial chart with 'popularity'
    updateLineChart(genreData, 'popularity');

    // Add legend below the graph
    const legend = d3.select(lineChart).append('div')
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
        updateLineChart(genreData, selectedMetric);
    });

    /* ----- Filter Bar ----- */
});
