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

function processSankeyData(rawData, sourceKey, targetKey) {
    const nodes = [];
    const nodeIndex = new Map();

    const flattenedData = rawData.flatMap(d => {
        return {
            [sourceKey]: d.director,
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

function transformDirectorToGenre(rawData) {
    const data = [];

    rawData.forEach(directorEntry => {
        const director = directorEntry.director;

        directorEntry.data.forEach(filmData => {
            if (filmData.films && Array.isArray(filmData.films)) {
                filmData.films.forEach(film => {
                    if (film.genres) {
                        const genres = film.genres.split(',').map(g => g.trim());

                        genres.forEach(genre => {
                            data.push({
                                director: director,
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

function updateSankeyChart(svg, data, width, height, color) {
    const sankey = d3.sankey()
        .nodeWidth(15) // Set the desired node width
        .nodePadding(10) // Set the padding between nodes
        .extent([[1, 1], [width - 1, height - 5]]); 

    const directorToGenre = transformDirectorToGenre(data);
    const sankeyData = processSankeyData(directorToGenre, "director", "genre");

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
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("stroke", "#ddd")
        .attr("fill", "none");

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
        .attr("stroke", "#000");

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



function updateSankeyChartWindow(container, svg, data, color, margin) {
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    d3.select(svg.node().parentNode)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    updateSankeyChart(svg, data, width, height, color);
}

export { initializeSankeyChart, updateSankeyChart, updateSankeyChartWindow };