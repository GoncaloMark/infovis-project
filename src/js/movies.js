import { initializeFilterBar } from './filterBar.js';
import { initializeLineChart, updateLineChart, updateLineChartWindow } from './linechart.js';
import { initializeBoxPlot, updateBoxPlot, updateBoxPlotWindow } from './boxplot.js';
import { initializeStackedBarChart, updateStackedBarChart, updateStackedBarChartWindow } from './stackedbarchart.js';
import { initializeHorizontalBarChart, updateHorizontalBarChart, updateHorizontalBarChartWindow} from './barchart.js'

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
    const stackedBarChart = document.getElementById('stackedBarChart');
    const barChart = document.getElementById('barChart');

    // Define margin for all charts
    const margin = { top: 20, right: 30, bottom: 20, left: 70 };

    const barChartWidth = barChart.clientWidth - margin.left - margin.right;
    const barChartHeight = barChart.clientHeight - margin.top - margin.bottom;

    // Calculate width and height for each chart
    const lineChartWidth = lineChart.clientWidth - margin.left - margin.right;
    const lineChartHeight = lineChart.clientHeight - margin.top - margin.bottom;

    const boxPlotWidth = boxPlot.clientWidth - margin.left - margin.right;
    const boxPlotHeight = boxPlot.clientHeight - margin.top - margin.bottom;

    const stackedBarChartWidth = stackedBarChart.clientWidth - margin.left - margin.right;
    const stackedBarChartHeight = stackedBarChart.clientHeight - margin.top - margin.bottom;

    // Define scales

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Initialize each chart with calculated dimensions
    const { svg: svgLine } = initializeLineChart(lineChart, margin, lineChartWidth, lineChartHeight, color);
    const { svg: svgBox } = initializeBoxPlot(boxPlot, margin, boxPlotWidth, boxPlotHeight);
    const { svg: svgStackedBar } = initializeStackedBarChart(stackedBarChart, margin, stackedBarChartWidth, stackedBarChartHeight);
    const { svg: svgBar } = initializeHorizontalBarChart(barChart, margin, barChartWidth, barChartHeight);

    // Generate initial genre data
    var genreData = getGenreData(genres.slice(0, 3), data, yearsRange.minYear, yearsRange.maxYear);

    var selectedMetric = 'popularity';
    // Dropdown change event handler for line chart
    d3.select('#metricDropdown').on('change', function () {
        selectedMetric = this.value;
        updateLineChart(lineGraph, svgLine, genreData, selectedMetric, color, lineChartWidth, lineChartHeight, "genre");
    });

    console.log(genreData)

    // Update all graphs
    const updateAllGraphs = (filters) => {
        genreData = getGenreData(filters.selectedGenres, data, filters.minYear, filters.maxYear);
        const selectedMetric = document.getElementById('metricDropdown').value;

        updateLineChart(lineChart, svgLine, genreData, selectedMetric, color, lineChartWidth, lineChartHeight, "genre");
        updateBoxPlot(svgBox, genreData, color, 40, boxPlotWidth, boxPlotHeight, "genre");
        updateStackedBarChart(svgStackedBar, genreData, ['budget', 'revenue'], stackedBarChartWidth, stackedBarChartHeight, "genre", color);
        updateHorizontalBarChart(
            svgBar,
            genreData,
            barChartWidth,
            barChartHeight,
            "vote_average",
            "genre",
            color
        );
        

        // Add event listener to hide tooltip when clicking anywhere outside the chart
        d3.selectAll('.tooltip').transition().duration(200).style('opacity', 0);
        d3.select(document).on('click', () => {
            // Hide tooltips for all types
            d3.selectAll('.tooltip-line').transition().duration(200).style('opacity', 0);
            d3.selectAll('.tooltip-box').transition().duration(200).style('opacity', 0);
        });

    };

    // Set up a resize event listener
    window.addEventListener('resize', () => {
        const selectedMetric = document.getElementById('metricDropdown').value;
        updateBoxPlotWindow(boxPlot, svgBox, genreData, color, margin, 40, "genre");
        updateLineChartWindow(lineChart, svgLine, genreData, selectedMetric, color, margin, "genre");
        updateStackedBarChartWindow(stackedBarChart, svgStackedBar, genreData, ['budget', 'revenue'], margin, "genre", color);
        updateHorizontalBarChartWindow(barChart, svgBar, genreData, margin, color)
    });

    // Initialize the filter bar
    initializeFilterBar(genres, updateAllGraphs, yearsRange);

    // Initial render
    updateAllGraphs({ selectedGenres: genres.slice(0, 3), ...yearsRange });

    $(document).ready(function () {
        $("#toggleMovieSidebar").click(function () {
            $("#movieSidebar").toggleClass("closed");
            $("#toggleMovieSidebar").toggleClass("open");
            // Change button icon dynamically
            const isClosed = $("#movieSidebar").hasClass("closed");
            $("#toggleMovieSidebar i").toggleClass("bi-chevron-left", isClosed);
            $("#toggleMovieSidebar i").toggleClass("bi-chevron-right", !isClosed);
        });
    });

});