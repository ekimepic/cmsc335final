//api info:
const url = 'https://api-to-find-grocery-prices.p.rapidapi.com/amazon?query=';
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': '57df4d3b4amshd8b072fa2510b25p11e193jsne2b01c393b38',
		'x-rapidapi-host': 'api-to-find-grocery-prices.p.rapidapi.com'
	}
};

//global variables:
let locallist = [];

// functions:

//add_grocery is a function where the user is adding a new grocery on top of the one already
//entered. add_grocery has to fetch the api price value (if exists). If the item does not exist,
//then the system sends an alert. If the item does exist, the function creates a new Grocery object
//and adds it to the list in the GroceryList type currentlist. If successful, it will also clear the
//form.
async function add_grocery() {
    console.log("add_groceries working");
    const docname = document.querySelector("#name").value.trim();
    let name;

    if (docname == "") {
        alert("Invalid grocery item, please try again");
        return false;
    }

    if (!document.querySelector("#quantity").value || document.querySelector("#quantity").value <= 0) {
        alert("Please choose a valid quantity");
        return false;
    }

    let tempurl = url + docname + "&country=us&page=1";

    try {
        const response = await fetch(tempurl, options);
        const json = await response.json();
        let price;

        if (json.products.length == 0) {
            alert("Grocery item not found");
            return false;
        } else {
            let found = false;
            let count = 0;
            for (item of json.products) {
                count++;
                if (item.currency == "$") {
                    price = item.price.substring(1);
                    name = item.name;
                    found = true;
                }
            }
            console.log(count);
            if (!found) {
                throw new Error("No US Dollar Currency item found");
            }
        }

        locallist.push({name: name, quantity: document.querySelector("#quantity").value, price: price});
        document.querySelector("#grocerylist").innerHTML += `<ul>${name}x${document.querySelector("#quantity").value}, $${Math.trunc(100*price*document.querySelector("#quantity").value)/100}</ul>`;

        //resetting fields in form
        document.querySelector("#quantity").value = 1;
        document.querySelector("#name").value = "";

        document.querySelector("#emptymessage").innerHTML = "";

        return true;
    } catch (error) {
        console.error("error:", error);
        alert("ERROR: Please try again");
        return false;
    }      
}

async function shop_submission() {
    console.log("🧪 shop_submission() is running");
    const name = document.querySelector("#name").value.trim();

    if (name != "") {
        const added = await add_grocery();
        if (!added) {
            return false;
        }
    }

    if (locallist.length == 0) {
        alert("ERROR: Grocery list is empty");
        return false;
    }
    document.querySelector("#groceryoutput").value = JSON.stringify(locallist);
    locallist = [];
    return true;
}

//event listeners:

if (document.querySelector('#saveform')) {
    document.querySelector('#saveform').addEventListener('submit', async function(event) {
        console.log("saveform");
        try {
            event.preventDefault();

            const check = await fetch(`/check-name?name=${document.querySelector("#name").value}`);
            const json = await check.json();

            if (json.success) {
                event.target.submit();
            } else {
                document.querySelector("#save_result").innerHTML = "Error saving list. Please try again later.";
            }
        } catch (error) {
            console.error("Saveform submit error", error);
        }
    });
}

if (document.querySelector("#shoppingform")) {
    document.querySelector("#shoppingform").addEventListener('submit', async function (event) {
        event.preventDefault();

        event.preventDefault();
        const success = await shop_submission();
        if (success) {
            event.target.submit();
        }
    });
}

if (document.querySelector('#lookupform')) {
    document.querySelector('#lookupform').addEventListener('submit', async function(event) {
        event.preventDefault();

        const check = await fetch(`/check-db?name=${document.querySelector("#name").value}`);
        const json = await check.json();

        if (json.success) {
            document.querySelector('#result').value = json.table;
            event.target.submit();
        } else {
            document.querySelector("#errormess").innerHTML = "ERROR: List does not exist";
        }
    });
}
