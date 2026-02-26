

var apiFetch = async () => {
    var data = await fetch('https://dummyjson.com/products?limit=12&skip=1')
    var data = await data.json()
    displayData(data.products);
}

var displayData = (products) => {

    var finalData = '';

    products.forEach((v, i) => {
        finalData += `<article class="card" data-name="Wireless Headphones" data-price="99" data-category="audio">
          <div class="media"><img src="${v.thumbnail}" alt="Headphones"></div>
          <div class="card-body">
            <h3 class="title">${v.title}</h3>
            <div class="meta">${v.category} • ${v.brand}</div>
            <div class="card-foot">
              <div class="price">$${v.price}</div>
              <button class="btn add">Add to cart</button>
            </div>
          </div>
        </article>`
    })

    document.getElementById('grid').innerHTML = finalData;
}

apiFetch();