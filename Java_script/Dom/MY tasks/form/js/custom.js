
const userData = [];

function displayUser() {
    var data_1 = '';

    userData.forEach((v, i) => {
        data_1 += `<tr>
            <td>${i + 1}</td>
            <td>${v.name}</td>
            <td>${v.email}</td>
            <td>${v.mobile_number}</td>
        </tr>`;
    })

    document.getElementById('user_data').innerHTML = data_1;  //id = user_data//
}

displayUser()

document.getElementById('form_handler').addEventListener('submit', (event) => {      //form_handler//
    event.preventDefault();

    var data_2 = {
        name: event.target.name.value,
        email: event.target.email.value,
        mobile_number: event.target.mobile_number.value,
    };

    userData.unshift(data_2);
    displayUser()

    event.target.reset();
})



















// localStorage.setItem('user_name','Dikshant Gehlot');

// console.log(localStorage.getItem('user_name'));