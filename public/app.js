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


const image = document.querySelector('#image');

fetch('http://localhost:3000/api/getLatestImage')
  .then(res => res.blob())
  .then(blob => {
    const imgUrl = URL.createObjectURL(blob);
    image.src = imgUrl;
  });

// async function getImage() {
//     let reqHeaders = new Headers();
//     //reqHeaders.append('Accept', `*/*`);
//     reqHeaders.append('Content-Type', 'application/json');
//     reqHeaders.append('Connection', 'keep-alive');
    
//     let options = {
//         method: 'GET',
//         headers: reqHeaders
//     }
//     return await fetch(`http://localhost:3000/api/getLatestImage`, options);
// }

// async function renderImage() {
//     let root2 = document.getElementById('root2');
//     let img = document.createElement('img');
//     img.src = await getImage();
//     // root2.innerHTML = `<div><b>BEFORE IMAGE HERE</b></div><img src=${await getImage()}><div><b>AFTER IMAGE HERE</b></div>`
//     root2.appendChild(img);
// }

//renderImage();

fetchAffirmation();