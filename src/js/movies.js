import { initializeLineChart, updateLineChart } from './linechart.js';
import { initializeBoxPlot, updateBoxPlot } from './boxplot.js';

// Load data from '../../data/movies.csv'
d3.csv('../../data/movies.csv').then(data => {

    // Data structure adjustments
    data.forEach(d => {
        d.popularity = parseFloat(d.popularity); // Ensure popularity is a number
        d.vote_average = parseFloat(d.vote_average); // Ensure vote_average is a number
        d.release_year = parseInt(d.release_date.split('-')[0]); // Extract release year
        d.roi = (d.revenue - (d.budget * 2)) / d.budget * 100; // Calculate ROI
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

    // Get the oldest and most recent years
    const years = data.map(d => d.release_year);
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
                    roi: d3.mean(movies, d => (d.revenue - (d.budget * 2)) / d.budget * 100),
                    films_released: movies.length,
                    films: movies
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
    const genreData = getGenreData(selectedGenres, data);
    console.log(genreData);

    /* ----- Line Chart ----- */
    const lineChart = document.getElementById('lineGraph');
    const boxPlot = document.getElementById('boxPlot');

    const margin = { top: 20, right: 30, bottom: 20, left: 70 };
    const width = lineChart.clientWidth - margin.left - margin.right;
    const height = lineChart.clientHeight - margin.top - margin.bottom;
    const boxWidth = 40;

    const x = d3.scaleLinear()
        .domain([oldestYear, mostRecentYear])
        .range([0, width]);

    const y = d3.scaleLinear().range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Initialize Line Chart
    const { svg: svgLine } = initializeLineChart(lineChart, margin, width, height, x, y, color);
    console.log(svgLine);

    // Initialize Box Plot
    const { svg: svgBox } = initializeBoxPlot(boxPlot, margin, width, height);
    console.log(svgBox);
    
    // Dropdown change event handler
    d3.select('#metricDropdown').on('change', function () {
        const selectedMetric = this.value;
        updateLineChart(lineChart, svgLine, genreData, selectedMetric, x, y, color, height);
    });

    const updateAllGraphs = () => {
        const selectedGenres = Array.from(document.querySelectorAll('.genre input:checked')).map(d => d.parentNode.textContent.trim());
        const startingYear = $("#minYear").val();
        const endingYear = $("#maxYear").val();
        const genreData = getGenreData(selectedGenres, data, startingYear, endingYear);
        const selectedMetric = document.getElementById('metricDropdown').value;
        console.log(genreData);

        updateLineChart(lineChart, svgLine, genreData, selectedMetric, x, y, color, height);
        updateBoxPlot(boxPlot, svgBox, genreData, selectedGenres, color, boxWidth, height);
    };

    // Add event listener to all checkboxes
    document.querySelectorAll('.genre input').forEach(input => {
        input.addEventListener('change', updateAllGraphs);
    });

    // Initial render
    updateAllGraphs();


    /* ----- Time Slider ----- */
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
