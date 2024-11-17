// Load genre list
let genres = ['Top Genres', 'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Historical', 'Horror', 'Mystery', 'Philosophical', 'Political', 'Romance', 'Saga', 'Satire', 'Science fiction', 'Social', 'Speculative', 'Thriller', 'Urban', 'Western'];

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