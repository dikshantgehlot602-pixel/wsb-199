

// function displayName() {
//     console.log('hello');
// }

// // setTimeout(displayName,1000);


// setTimeout(() => {
//     console.log('welcome')
// }, 4000);

// var output = '';

// function setTime() {
//     output = setTimeout(() => {
//         console.log('hello')
//     }, 4000);
// }

// function clearTime() {
//     clearTimeout(output);
// }

// setInterval(() => {
//     console.log('welcome');
// },1000)

var counter = 1;
var output = '';

function setCount() {
    output = setInterval(() => {
        console.log(counter);
        counter++;
    }, 1000)
}

function stopCount() {
    clearInterval(output);
}

function resetCount() {
    clearInterval(output);
    counter = 1;
}