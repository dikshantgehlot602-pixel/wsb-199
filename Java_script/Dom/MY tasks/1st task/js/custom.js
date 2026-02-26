
// // Read Data
// var outupt = document.getElementById('row2').innerText;

// // Change Data
// document.getElementById('output').innerText = outupt;


var output = document.getElementsByClassName('row');

var output = document.getElementsByTagName('div');

console.log(output[0].innerHTML);

var out = document.getElementsByClassName('outer');
out = out[0];

console.log(out.innerHTML);

document.getElementById('output').innerHTML = out.innerHTML;


var out = document.querySelector('#row').innerText;
var out = document.querySelector('.row').innerText;
var out = document.querySelector('div').innerText;

var out = document.querySelectorAll('#row');
var out = document.querySelectorAll('.row');
var out = document.querySelectorAll('div');

console.log(out);
