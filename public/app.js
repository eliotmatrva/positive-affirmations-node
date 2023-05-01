async function fetchAffirmation(options) {
    let root = document.getElementById('root');
    let response = await fetch(oapiCompletionUrl, options);
    let data = await response.json();
    let affirmation = data.choices[0].text;
    let myData = JSON.stringify(data);
    root.textContent = affirmation;
    console.log(affirmation);
}

// fetchAffirmation(options);