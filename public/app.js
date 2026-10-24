const form = document.getElementById('greeting');
const result = document.getElementById('result');
const button = form.querySelector('button');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  button.disabled = true;
  result.textContent = 'Loading…';
  try {
    const response = await fetch('/.netlify/functions/oscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: document.getElementById('name').value }),
    });
    if (!response.ok) throw new Error('Greeting unavailable');
    const data = await response.json();
    result.textContent = `${data.title}: ${data.name}`;
  } catch {
    result.textContent = 'Could not load the greeting. Please try again.';
  } finally {
    button.disabled = false;
  }
});
