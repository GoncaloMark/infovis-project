import { initializeSankeyChart, updateSankeyChart, updateSankeyChartWindow} from './sankey.js';
import { initializeFilterBar } from './filterBar.js';
import { initializeLineChart, updateLineChart, updateLineChartWindow } from './linechart.js';
import { initializeBoxPlot, updateBoxPlot, updateBoxPlotWindow } from './boxplot.js';
import { initializeStackedBarChart, updateStackedBarChart, updateStackedBarChartWindow } from './stackedbarchart.js';

d3.csv('../../data/movies.csv').then(data => {
    const yearsRange = {
        minYear: Math.min(...data.map(d => +d.release_year)),
        maxYear: Math.max(...data.map(d => +d.release_year)),
    };

    const tempDirectors = [
        ...new Set(
            data.flatMap(d => d.director.split(', ').map(name => name.trim()))
        )
    ].sort();

    const directorCounts = data.flatMap(d => d.director.split(', ').map(name => name.trim()))
        .reduce((counts, director) => {
            counts[director] = (counts[director] || 0) + 1;
            return counts;
        }, {});

    const directors = tempDirectors.filter(director => directorCounts[director] >= 5);

    function getDirectorData(data, dirNames, startingYear = 1970, endingYear = 2024) {
        return dirNames.map(dir => {
            const movies = data.filter(
                d => d.director.includes(dir) && d.release_year >= startingYear && d.release_year <= endingYear
            );
    
            const moviesByYear = d3.group(movies, d => d.release_year);
    
            const aggregatedDataByYear = Array.from(moviesByYear, ([year, movies]) => {
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

            return {
                director: dir,
                data: aggregatedDataByYear
            };
        });
    }
    

    const sankey = document.getElementById('sankeyChart');
    const lineChart = document.getElementById('lineGraph');
    const boxPlot = document.getElementById('boxPlot');
    const stackedBarChart = document.getElementById('stackedBarChart');

    // Define margin for all charts
    const margin = { top: 20, right: 30, bottom: 20, left: 70 };

    const sankeyWidth = sankey.clientWidth - margin.left - margin.right;
    const sankeyHeight = sankey.clientHeight - margin.top - margin.bottom;

    const lineChartWidth = lineChart.clientWidth - margin.left - margin.right;
    const lineChartHeight = lineChart.clientHeight - margin.top - margin.bottom;

    const boxPlotWidth = boxPlot.clientWidth - margin.left - margin.right;
    const boxPlotHeight = boxPlot.clientHeight - margin.top - margin.bottom;

    const stackedBarChartWidth = stackedBarChart.clientWidth - margin.left - margin.right;
    const stackedBarChartHeight = stackedBarChart.clientHeight - margin.top - margin.bottom;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const { svg: svgSankey } = initializeSankeyChart(sankey, margin, sankeyWidth, sankeyHeight);
    const { svg: svgLine } = initializeLineChart(lineChart, margin, lineChartWidth, lineChartHeight, color);
    const { svg: svgBox } = initializeBoxPlot(boxPlot, margin, boxPlotWidth, boxPlotHeight);
    const { svg: svgStackedBar } = initializeStackedBarChart(stackedBarChart, margin, stackedBarChartWidth, stackedBarChartHeight);

    var directorData = getDirectorData(data, directors.slice(0, 3), yearsRange.minYear, yearsRange.maxYear);

    console.log(directorData)

    var selectedMetric = 'popularity';
    // Dropdown change event handler for line chart
    d3.select('#metricDropdown').on('change', function () {
        selectedMetric = this.value;
        updateLineChart(lineGraph, svgLine, directorData, selectedMetric, color, lineChartWidth, lineChartHeight, "director");
    });

    // Update all graphs
    const updateAllGraphs = (filters) => {
        console.log(filters)
        directorData = getDirectorData(data, filters.selectedGenres, filters.minYear, filters.maxYear);
        const selectedMetric = document.getElementById('metricDropdown').value;

        updateLineChart(lineChart, svgLine, directorData, selectedMetric, color, lineChartWidth, lineChartHeight, "director");
        updateBoxPlot(svgBox, directorData, color, 40, boxPlotWidth, boxPlotHeight, "director");
        updateStackedBarChart(svgStackedBar, directorData, ['budget', 'revenue'], stackedBarChartWidth, stackedBarChartHeight, "director", color);
        updateSankeyChart(
            svgSankey,
            directorData,
            sankeyWidth,
            sankeyHeight,
            color,
            "director", "director"
        );
        

        // Add event listener to hide tooltip when clicking anywhere outside the chart
        d3.selectAll('.tooltip').transition().duration(200).style('opacity', 0);
        d3.select(document).on('click', () => {
            // Hide tooltips for all types
            d3.selectAll('.tooltip-line').transition().duration(200).style('opacity', 0);
            d3.selectAll('.tooltip-box').transition().duration(200).style('opacity', 0);
            d3.selectAll('.tooltip-sankey').transition().duration(200).style('opacity', 0);
            d3.selectAll('.tooltip-stacked').transition().duration(200).style('opacity', 0);
        });

    };

    // Set up a resize event listener
    window.addEventListener('resize', () => {
        const selectedMetric = document.getElementById('metricDropdown').value;
        updateBoxPlotWindow(boxPlot, svgBox, directorData, color, margin, 40, "director");
        updateLineChartWindow(lineChart, svgLine, directorData, selectedMetric, color, margin, "director");
        updateStackedBarChartWindow(stackedBarChart, svgStackedBar, directorData, ['budget', 'revenue'], margin, "director", color);
        updateSankeyChartWindow(sankey, svgSankey, directorData, color, margin, "director", "director")
    });

    // Initialize the filter bar
    initializeFilterBar(directors, updateAllGraphs, yearsRange);

    // Initial render
    updateAllGraphs({ selectedGenres: directors.slice(0, 3), ...yearsRange });

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