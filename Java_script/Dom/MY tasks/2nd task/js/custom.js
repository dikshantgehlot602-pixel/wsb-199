function swipdata(){
    colum_1 = document.getElementById('colum_1').innerText;
    colum_2 = document.getElementById('colum_2').innerText;

    document.getElementById('colum_1').innerText = colum_2;
    document.getElementById('colum_2').innerText = colum_1;
}