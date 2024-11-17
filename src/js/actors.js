// Selected actors (max 5)
let actors = ['Angelina Jolie', 'Tom Cruise', 'Tom Hanks', 'Leonardo DiCaprio', 'Brad Pitt']

const selectedResults = document.getElementById('selectedResults');
actors.forEach(actor => {
    const li = document.createElement('li');
    li.className = 'selected-result list-group-item';
    li.innerHTML = `
        <button class="btn-close me-2" type="button" aria-label="Close"></button>
        ${actor}
    `;
    selectedResults.appendChild(li);
});