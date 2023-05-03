async function fetchAffirmation() {
    let root = document.getElementById('root');
    let response = await fetch('http://localhost:3000/api/getLatestAffirmation');
    let data = await response.text();
    //let data = await response.json();
    // let affirmation = data.choices[0].text;
    // let myData = JSON.stringify(data);
    root.textContent = (data);
    console.log(`response is:
    ${response}`);
    console.log(`data is
    ${data}`);
}

async function getImage() {
    return await fetch(`http://localhost:3000/api/getLatestImage`);
}

async function renderImage() {
    let rootElem = document.getElementById('root2');
    rootElem.innerHTML = `<img src=${await getImage()}>`
}

renderImage();

fetchAffirmation();