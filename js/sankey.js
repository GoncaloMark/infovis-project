function initializeSankeyChart(container, margin, width, height) {
    const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("g").attr("class", "sankey-links");
    svg.append("g").attr("class", "sankey-nodes");

    return { svg };
}

function processSankeyData(rawData, sourceKey, targetKey, label) {
    const nodes = [];
    const nodeIndex = new Map();

    const flattenedData = rawData.flatMap(d => {
        return {
            [sourceKey]: d[label],
            [targetKey]: d.genre,
            value: d.value || 1
        }
    }
    );

    const genreCounts = d3.rollups(
        flattenedData,
        v => v.length,
        d => `${d[sourceKey]}->${d[targetKey]}`
    );

    const linkValues = new Map(genreCounts.map(([key, count]) => [key, count]));

    flattenedData.forEach(d => {
        if (!nodeIndex.has(d[sourceKey])) {
            nodeIndex.set(d[sourceKey], nodes.length);
            nodes.push({ name: d[sourceKey] });
        }
        if (!nodeIndex.has(d[targetKey])) {
            nodeIndex.set(d[targetKey], nodes.length);
            nodes.push({ name: d[targetKey] });
        }
    });

    const links = flattenedData.map(d => ({
        source: nodeIndex.get(d[sourceKey]),
        target: nodeIndex.get(d[targetKey]),
        value: linkValues.get(`${d[sourceKey]}->${d[targetKey]}`)
    }));

    return { nodes, links };
}

function transformDirectorToGenre(rawData, label) {
    const data = [];

    rawData.forEach(directorEntry => {
        const director = directorEntry[label];
        // console.log(directorEntry)

        directorEntry.data.forEach(filmData => {
            if (filmData.films && Array.isArray(filmData.films)) {
                filmData.films.forEach(film => {
                    if (film.genres) {
                        const genres = film.genres.split(',').map(g => g.trim());

                        genres.forEach(genre => {
                            data.push({
                                [label]: director,
                                genre: genre,
                                value: 1
                            });
                        });
                    }
                });
            }
        });
    });

    return data;
}

function updateSankeyChart(svg, data, width, height, color, label, srcKey) {
    const sankey = d3.sankey()
        .nodeWidth(15) // Set the desired node width
        .nodePadding(10) // Set the padding between nodes
        .extent([[1, 1], [width - 1, height - 5]]);

    const directorToGenre = transformDirectorToGenre(data, label);
    const sankeyData = processSankeyData(directorToGenre, srcKey, "genre", label);

    console.log(data)

    if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
        svg.select(".sankey-links").selectAll("path").remove();
        svg.select(".sankey-nodes").selectAll("g").remove();
        return;
    }

    const sankeyLayout = sankey({
        nodes: sankeyData.nodes.map(d => ({ ...d })),
        links: sankeyData.links.map(d => ({ ...d }))
    });

    const link = svg
        .select(".sankey-links")
        .selectAll("path")
        .data(sankeyLayout.links);

    link.enter()
        .append("path")
        .attr("class", "sankey-link")
        .merge(link)
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "#666") // Base stroke color
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .style("mix-blend-mode", "multiply") // Enable blend mode
        .style("opacity", 0.25); // Make links slightly transparent


    link.exit().remove();

    const node = svg
        .select(".sankey-nodes")
        .selectAll("g")
        .data(sankeyLayout.nodes);

    const nodeEnter = node.enter().append("g").attr("class", "sankey-node");

    nodeEnter
        .append("rect")
        .merge(node.select("rect"))
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", sankey.nodeWidth())
        .attr("fill", (d, i) => color(i))
        .attr("stroke", "#000")
        .on("click", (event, d) => {
            // Disable the #expandData button (add disabled class)
            d3.select("#expandData").classed("disabled", true);

            d3.select('#movieTableBody')
                .html(''); // Clear the table body
            
            d3.select('#movieTableHead')
                .html(''); // Clear the table head
            
            d3.select('#movieSidebar h5')
                .html('<strong>Sankey</strong>'); // Clear the sidebar title
            
            event.stopPropagation();
            const tooltip = d3.select(".tooltip-sankey");
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);

            // Find the clicked director's data
            const directorData = data.find(item => item[label] === d.name);
            if (!directorData) return;

            // Parse and count genres
            const genreCounts = {};
            directorData.data.forEach(year => {
                year.films.forEach(film => {
                    film.genres.split(",").forEach(genre => {
                        const trimmedGenre = genre.trim();
                        genreCounts[trimmedGenre] = (genreCounts[trimmedGenre] || 0) + 1;
                    });
                });
            });

            // console.log(genreCounts)

            // Convert genre counts into an array and find the most popular genre
            const genres = Object.entries(genreCounts);
            const mostPopularGenre = genres.reduce(
                (max, genre) => genre[1] > max[1] ? genre : max,
                ["", 0]
            );

            // Get the horizontal and vertical scroll offsets of the scrolling container
            const scrollContainer = document.body; // Use the <body> element or change to the appropriate container
            const scrollLeft = scrollContainer.scrollLeft; // Horizontal scroll offset

            // Tooltip Content
            tooltip.html(`
                <strong>${label}:</strong> ${d.name}<br>
                <strong>Movies per Genre:</strong><br>
                ${genres.map(g => `${g[0]}: ${g[1]}`).join("<br>")}
                <br>
                <strong>Most Films in:</strong> ${mostPopularGenre[0]} (${mostPopularGenre[1]} movies)
            `)
                .style("left", `${event.clientX + 10 - 250 + scrollLeft}px`)
                .style("top", `${event.clientY + window.scrollY + 10}px`);

            // Sidebar Content
            d3.select("#movieSidebar h5").html(`<strong>Details for ${label}: ${d.name}</strong>`);

            const genreStats = genres.map(g => `<tr><td>${g[0]}</td><td>${g[1]}</td></tr>`).join("");
            d3.select("#movieTableHead").html(`
                <tr>
                    <th>Genre</th>
                    <th>Movies Count</th>
                </tr>
            `);
            d3.select("#movieTableBody").html(genreStats);

            // Highlight the most popular genre
            d3.select("#movieSidebar .highlight").html(`
                <p><strong>Most Popular Genre:</strong> ${mostPopularGenre[0]} (${mostPopularGenre[1]} movies)</p>
            `);

            // Tooltip hide logic on body click
            d3.select("body").on("click", () => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            });
        });

    nodeEnter
        .append("text")
        .merge(node.select("text"))
        .attr("x", d => d.x0 - 6)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d.name)
        .filter(d => d.x0 < width / 2)
        .attr("x", d => d.x1 + 6)
        .attr("text-anchor", "start");

    node.exit().remove();
}



function updateSankeyChartWindow(container, svg, data, color, margin, label, srcKey) {
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    d3.select(svg.node().parentNode)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    updateSankeyChart(svg, data, width, height, color, label, srcKey);
}

export { initializeSankeyChart, updateSankeyChart, updateSankeyChartWindow };