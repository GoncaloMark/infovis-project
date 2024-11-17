// Selected directors (max 5)
let selectedDirectors = ['Steven Spielberg', 'Martin Scorsese', 'Alfred Hitchcock', 'Quentin Tarantino', 'Stanley Kubrick']

const selectedResults = document.getElementById('selectedResults');
selectedDirectors.forEach(director => {
    const li = document.createElement('li');
    li.className = 'selected-result list-group-item';
    li.innerHTML = `
        <button class="btn-close me-2" type="button" aria-label="Close"></button>
        ${director}
    `;
    selectedResults.appendChild(li);
});