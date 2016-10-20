function* displayCity() {
    let cities = [];
    cities.push({"state": "punjab", "city": "ludhiana"});
    cities.push({"state": "punjab", "city": "mohali"});
    cities.push({"state": "punjab", "city": "patiala"});
    cities.push({"state": "punjab", "city": "jalandhar"});
    cities.push({"state": "punjab", "city": "amritsar"});
    cities.push({"state": "punjab", "city": "fazilka"});
    cities.push({"state": "punjab", "city": "moga"});
    cities.push({"state": "punjab", "city": "ropar"});
    cities.push({"state": "delhi", "city": "noida"});
    cities.push({"state": "delhi", "city": "new delhi"});
    cities.push({"state": "delhi", "city": "gurugram"});
    cities.push({"state": "delhi", "city": "sonipat"});

    for (let i=0; i<cities.length; i++) {
        let city = cities[i];
        if (city["state"]=="delhi") {
            yield city["city"];
        }
    }
}

for (let ret of displayCity()) {
    console.log(ret);
}
/*let showCity = displayCity();
console.log(showCity.next());
console.log(showCity.next());*/