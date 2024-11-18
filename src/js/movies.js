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

    // Check the first 5 genres by default
    document.querySelectorAll('.genre input').forEach((input, index) => {
        if (index < 3) {
            input.checked = true;
        }
    });

    // Add event listener to all checkboxes
    document.querySelectorAll('.genre input').forEach(input => {
        input.addEventListener('change', () => {
            const allCheckboxes = document.querySelectorAll('.genre input');
            const checkedGenres = document.querySelectorAll('.genre input:checked');

            if (checkedGenres.length >= 5) {
                // Disable all unchecked checkboxes
                allCheckboxes.forEach(checkbox => {
                    if (!checkbox.checked) {
                        checkbox.disabled = true;
                    }
                });
            } else {
                // Enable all checkboxes if fewer than 5 are selected
                allCheckboxes.forEach(checkbox => {
                    checkbox.disabled = false;
                });
            }

            document.getElementById('selectedLimit').textContent = `${checkedGenres.length} of 5 selected`;

            // Update the graphs when the selection changes
            updateAllGraphs();
        });
    });

    // Add an event listener to the 'Uncheck All' button
    document.getElementById('uncheckAll').addEventListener('click', () => {
        document.querySelectorAll('.genre input').forEach(input => {
            input.checked = false;
        });

        // Enable all checkboxes
        document.querySelectorAll('.genre input').forEach(checkbox => {
            checkbox.disabled = false;
        });

        document.getElementById('selectedLimit').textContent = '0 of 5 selected';

        // Update the graphs when the selection changes
        updateAllGraphs();
    });

    // Filter movies from 1970 to today and only include released movies
    // TODO : Make this filter in the data treatment

    const filteredData = data.filter(d => d.release_year >= 1970 && d.status === 'Released');

    // Get the oldest and most recent years
    const years = filteredData.map(d => d.release_year);
    const oldestYear = Math.min(...years);
    const mostRecentYear = Math.max(...years);

    /**
     * Generate genre data for a given list of genres, filtering by starting year.
     * @param {Array} genres - An array of genre strings.
     * @param {Array} data - The movie data array.
     * @param {Number} startingYear - The minimum release year to include.
     * @param {Number} endingYear - The maximum release year to include
     * @returns {Array} - An array of objects containing genre and its aggregated data.
     */
    function getGenreData(genres, data, startingYear = 1970, endingYear = 2024) {
        return genres.map(genre => {
            // Filter movies that include the genre and meet the starting year criteria
            const movies = data.filter(d => d.genres.includes(genre) && d.release_year >= startingYear && d.release_year <= endingYear);

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
    const genreData = getGenreData(selectedGenres, filteredData);

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

    // Initialize the legend container once
    const legendContainer = d3.select(lineChart)
        .append('div')
        .attr('class', 'legend-container')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('margin-top', '10px');

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

        // Update legend
        const legend = d3.select(lineChart).select('.legend-container');
        if (!legend.node()) {
            // Create a container for the legend if it doesn't exist
            d3.select(lineChart)
                .append('div')
                .attr('class', 'legend-container')
                .style('display', 'flex')
                .style('justify-content', 'center')
                .style('margin-top', '10px');
        } else {
            // Clear the existing legend content
            legend.selectAll('*').remove();
        }

        data.forEach((genreObj, index) => {
            legend.append('div')
                .style('margin', '0 10px')
                .html(`
                    <span style="display:inline-block;width:12px;height:12px;background-color:${color(index)};"></span>
                    ${genreObj.genre}
                `);
        });
    };

    // Dropdown change event handler
    d3.select('#metricDropdown').on('change', function () {
        const selectedMetric = this.value;
        updateLineChart(genreData, selectedMetric);
    });

    /* ----- Filter Bar ----- */

    const updateAllGraphs = () => {
        const selectedGenres = Array.from(document.querySelectorAll('.genre input:checked')).map(d => d.parentNode.textContent.trim());
        const startingYear = $("#minYear").val();
        const endingYear = $("#maxYear").val();
        const genreData = getGenreData(selectedGenres, filteredData, startingYear, endingYear);
        const selectedMetric = document.getElementById('metricDropdown').value;

        updateLineChart(genreData, selectedMetric);
    };

    // Add event listener to all checkboxes
    document.querySelectorAll('.genre input').forEach(input => {
        input.addEventListener('change', updateAllGraphs);
    });

    // Initial render
    updateAllGraphs();

    $(function () {
        // Initialize the slider with min, max, and initial values
        $("#slider-range").slider({
            range: true,
            min: 1970,
            max: 2024,
            values: [1970, 2024],
            slide: function (event, ui) {
                // Get the current min and max values
                var minYear = ui.values[0];
                var maxYear = ui.values[1];

                // If the difference between the two values is less than 5, adjust
                if (maxYear - minYear < 5) {
                    if (ui.handleIndex === 0) {
                        // If the left thumb is being moved, lock it to a position 5 years before the right thumb
                        minYear = maxYear - 5;
                    } else {
                        // If the right thumb is being moved, lock it to a position 5 years after the left thumb
                        maxYear = minYear + 5;
                    }
                }

                // Update the input fields only after adjusting the values
                $("#minYear").val(minYear);
                $("#maxYear").val(maxYear);

                // Update the slider values if needed (only if there was an adjustment)
                if (ui.values[0] !== minYear || ui.values[1] !== maxYear) {
                    $("#slider-range").slider("values", 0, minYear);
                    $("#slider-range").slider("values", 1, maxYear);
                }

                // Call updateAllGraphs after updating the values
                updateAllGraphs();
            }
        });

        // When the user types in the min year input field
        $("#minYear").on("input", function () {
            var minYear = parseInt($(this).val());
            var maxYear = parseInt($("#maxYear").val());

            console.log(minYear, maxYear);

            // Ensure that min year is not greater than max year - 5 and adjust maxYear if needed
            if (minYear != NaN && minYear <= maxYear - 5) {
                $("#slider-range").slider("values", 0, minYear);
            } else {
                // Adjust the maxYear to maintain a 5-year gap
                minYear = maxYear - 5;
                $(this).val(minYear);
                $("#slider-range").slider("values", 0, minYear);
            }

            // Call updateAllGraphs after changing the value
            updateAllGraphs();
        });

        // When the user types in the max year input field
        $("#maxYear").on("input", function () {
            var maxYear = parseInt($(this).val());
            var minYear = parseInt($("#minYear").val());

            // Ensure that max year is not smaller than min year + 5 and adjust minYear if needed
            if (maxYear != Nan && maxYear >= minYear + 5) {
                $("#slider-range").slider("values", 1, maxYear);
            } else {
                // Adjust the minYear to maintain a 5-year gap
                maxYear = minYear + 5;
                $(this).val(maxYear);
                $("#slider-range").slider("values", 1, maxYear);
            }

            // Call updateAllGraphs after changing the value
            updateAllGraphs();
        });
    });

});
