/**
 * Initialize the filter bar with genre checkboxes and the time slider.
 * @param {Array} genres - List of unique genres.
 * @param {Function} onFiltersChange - Callback function to call when filters change.
 * @param {Object} yearsRange - Object containing `minYear` and `maxYear`.
 */
export function initializeFilterBar(genres, onFiltersChange, yearsRange) {
    const genreList = document.getElementById('genreList');
    genres.forEach(genre => {
        const li = document.createElement('li');
        li.className = 'genre list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            ${genre}
            <input type="checkbox" class="form-check-input" />
        `;
        genreList.appendChild(li);
    });

    // Check the first 3 genres by default
    document.querySelectorAll('.genre input').forEach((input, index) => {
        if (index < 3) input.checked = true;
    });

    // Add change event listener to update filters when checkboxes change
    document.querySelectorAll('.genre input').forEach(input => {
        input.addEventListener('change', () => {
            updateGenreCheckboxes();
            onFiltersChange(getSelectedFilters(yearsRange));
        });
    });

    // 'Uncheck All' button
    document.getElementById('uncheckAll').addEventListener('click', () => {
        document.querySelectorAll('.genre input').forEach(input => input.checked = false);
        updateGenreCheckboxes();
        onFiltersChange(getSelectedFilters(yearsRange));
    });

    // Initialize the slider
    initializeSlider(yearsRange, onFiltersChange);
}

/**
 * Update the state of the genre checkboxes to enforce selection limits.
 */
function updateGenreCheckboxes() {
    const allCheckboxes = document.querySelectorAll('.genre input');
    const checkedGenres = document.querySelectorAll('.genre input:checked');
    document.getElementById('selectedLimit').textContent = `${checkedGenres.length} of 5 selected`;

    allCheckboxes.forEach(checkbox => {
        checkbox.disabled = checkedGenres.length >= 5 && !checkbox.checked;
    });
}

/**
 * Get selected genres and year range from filters.
 * @param {Object} yearsRange - Object containing `minYear` and `maxYear`.
 * @returns {Object} - Filtered data including selected genres and year range.
 */
function getSelectedFilters(yearsRange) {
    const selectedGenres = Array.from(document.querySelectorAll('.genre input:checked'))
        .map(d => d.parentNode.textContent.trim());
    const minYear = parseInt(document.getElementById('minYear').value) || yearsRange.minYear;
    const maxYear = parseInt(document.getElementById('maxYear').value) || yearsRange.maxYear;

    return { selectedGenres, minYear, maxYear };
}

/**
 * Initialize the time slider with callbacks.
 * @param {Object} yearsRange - Object containing `minYear` and `maxYear`.
 * @param {Function} onFiltersChange - Callback function to call when filters change.
 */
function initializeSlider(yearsRange, onFiltersChange) {
    $("#slider-range").slider({
        range: true,
        min: yearsRange.minYear,
        max: yearsRange.maxYear,
        values: [yearsRange.minYear, yearsRange.maxYear],
        slide: function (event, ui) {
            // Enforce minimum range of 5 years
            let [minYear, maxYear] = ui.values;
            if (maxYear - minYear < 5) {
                if (ui.handleIndex === 0) minYear = maxYear - 5;
                else maxYear = minYear + 5;
            }
            $("#slider-range").slider("values", 0, minYear);
            $("#slider-range").slider("values", 1, maxYear);

            // Update input fields and trigger callback
            $("#minYear").val(minYear);
            $("#maxYear").val(maxYear);
            onFiltersChange(getSelectedFilters(yearsRange));
        }
    });

    // Handle manual input changes
    $("#minYear, #maxYear").on("input", function () {
        const minYear = parseInt($("#minYear").val());
        const maxYear = parseInt($("#maxYear").val());

        if (maxYear - minYear >= 5) {
            $("#slider-range").slider("values", 0, minYear);
            $("#slider-range").slider("values", 1, maxYear);
            onFiltersChange(getSelectedFilters(yearsRange));
        }
    });
}
