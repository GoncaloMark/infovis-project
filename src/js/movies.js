import { initializeFilterBar } from './filterBar.js';
import { initializeLineChart, updateLineChart } from './linechart.js';
import { initializeBoxPlot, updateBoxPlot } from './boxplot.js';

d3.csv('../../data/movies.csv').then(data => {
    // Get unique genres and year range
    const genres = [...new Set(data.flatMap(d => d.genres.split(', ')))].sort();
    const yearsRange = {
        minYear: Math.min(...data.map(d => +d.release_year)),
        maxYear: Math.max(...data.map(d => +d.release_year)),
    };

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

    // Initialize charts
    const lineChart = document.getElementById('lineGraph');
    const boxPlot = document.getElementById('boxPlot');
    const margin = { top: 20, right: 30, bottom: 20, left: 70 };
    const width = lineChart.clientWidth - margin.left - margin.right;
    const height = lineChart.clientHeight - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([yearsRange.minYear, yearsRange.maxYear]).range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const { svg: svgLine } = initializeLineChart(lineChart, margin, width, height, x, y, color);
    const { svg: svgBox } = initializeBoxPlot(boxPlot, margin, width, height);

    // Update all graphs
    const updateAllGraphs = (filters) => {
        const genreData = getGenreData(filters.selectedGenres, data, filters.minYear, filters.maxYear);
        const selectedMetric = document.getElementById('metricDropdown').value;

        updateLineChart(lineChart, svgLine, genreData, selectedMetric, x, y, color, height);
        updateBoxPlot(boxPlot, svgBox, genreData, filters.selectedGenres, color, 40, height);
    };

    // Initialize the filter bar
    initializeFilterBar(genres, updateAllGraphs, yearsRange);

    // Initial render
    updateAllGraphs({ selectedGenres: genres.slice(0, 5), ...yearsRange });
});
